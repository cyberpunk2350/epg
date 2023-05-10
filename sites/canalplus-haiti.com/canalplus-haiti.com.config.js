const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'canalplus-haiti.com',
  days: 2,
  url: function ({ channel, date }) {
    const diff = date.diff(dayjs.utc().startOf('d'), 'd')

    return `https://service.canal-overseas.com/ott-frontend/vector/53101/channel/${channel.site_id}/events?filter.day=${diff}`
  },
  async parser({ content }) {
    let programs = []
    const items = parseItems(content)
    for (let item of items) {
      if (item.title === 'Fin des programmes') return
      const detail = await loadProgramDetails(item)
      programs.push({
        title: item.title,
        description: parseDescription(detail),
        category: parseCategory(detail),
        icon: parseIcon(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    }

    return programs
  },
  async channels() {
    const html = await axios
      .get(`https://www.canalplus-haiti.com/guide-tv-ce-soir`)
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(html)
    const script = $('body > script:nth-child(2)').html()
    const [_, json] = script.match(/window.APP_STATE=(.*);/) || [null, null]
    const data = JSON.parse(json)
    const items = data.tvGuide.channels.byZapNumber

    return Object.values(items).map(item => {
      return {
        lang: 'fr',
        site_id: item.epgID,
        name: item.name
      }
    })
  }
}

async function loadProgramDetails(item) {
  if (!item.onClick.URLPage) return {}
  const url = item.onClick.URLPage
  const data = await axios
    .get(url)
    .then(r => r.data)
    .catch(console.log)
  return data || {}
}

function parseDescription(detail) {
  return detail.detail.informations.summary || null
}

function parseCategory(detail) {
  return detail.detail.informations.subGenre || null
}
function parseIcon(item) {
  return item.URLImage || item.URLImageDefault
}

function parseStart(item) {
  return dayjs.unix(item.startTime).tz("America/Port-au-Prince")
}

function parseStop(item) {
  return dayjs.unix(item.endTime).tz("America/Port-au-Prince")
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !data.timeSlices) return []
  const items = data.timeSlices.reduce((acc, curr) => {
    acc = acc.concat(curr.contents)
    return acc
  }, [])

  return items
}

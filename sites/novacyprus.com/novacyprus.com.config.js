const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'novacyprus.com',
  url({ channel, date }) {
    return `https://www.novacyprus.com/api/v1/tvprogram/from/${date.format('YYYYMMDD')}/to/${date
      .add(1, 'd')
      .format('YYYYMMDD')}`
  },
  logo({ channel }) {
    return channel.logo
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = start.add(item.slotDuration, 'm')
      programs.push({
        title: item.title,
        description: item.description,
        icon: parseIcon(item),
        start,
        stop
      })
    })

    return programs
  },
  async channels({ country, lang }) {
    const channels = await axios
      .get(`https://www.novacyprus.com/api/v1/guide/dailychannels`)
      .then(r => r.data)
      .catch(console.log)

    return channels.map(item => {
      const logo = item.Logo.replace(/\\/g, '').startsWith('/sites/default/files')
        ? `https://www.novacyprus.com${item.Logo}`
        : item.Logo

      return {
        lang: 'el',
        site_id: item.ChannelId,
        name: item.nameEl,
        logo
      }
    })
  }
}

function parseStart(item) {
  return dayjs.tz(item.datetime, 'YYYY-MM-DD HH:mm:ss', 'Asia/Nicosia')
}

function parseIcon(item) {
  return item.mediaItems.length ? item.mediaItems[0].CdnUrl : null
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.nodes)) return []

  return data.nodes.filter(i => i.ChannelId === channel.site_id)
}

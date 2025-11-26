import crypto from 'crypto'

const adjectives = ['blue','silver','crimson','emerald','amber','violet','cobalt','scarlet','lilac','sienna','indigo','ivory']
const animals = ['lion','fox','otter','owl','tiger','lynx','panda','dolphin','falcon','wolf','orca','sparrow']
const nouns = ['forest','cavern','harbor','citadel','garden','meadow','valley','summit','grove','glade','isle','shore']

export const generateSlug = () => {
  const parts = [
    adjectives[Math.floor(Math.random() * adjectives.length)],
    animals[Math.floor(Math.random() * animals.length)],
    nouns[Math.floor(Math.random() * nouns.length)],
    crypto.randomBytes(2).toString('hex'),
    crypto.randomBytes(2).toString('hex')
  ]
  return parts.join('-')
}

export const todayKey = () => {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export const randomId = (size = 16) => crypto.randomBytes(size).toString('hex')

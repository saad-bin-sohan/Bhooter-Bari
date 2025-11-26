const animals = ['fox','lion','otter','owl','tiger','koala','panda','wolf','lynx','orca','sparrow','dolphin']
const colors = ['#6c7ae0','#ff8a5c','#6bd3b3','#f6c343','#9a6bff','#60a5fa','#f472b6']
const icons: Record<string, string> = {
  fox: 'FOX',
  lion: 'LION',
  otter: 'OTTER',
  owl: 'OWL',
  tiger: 'TIGER',
  koala: 'KOALA',
  panda: 'PANDA',
  wolf: 'WOLF',
  lynx: 'LYNX',
  orca: 'ORCA',
  sparrow: 'BIRD',
  dolphin: 'DOLPH'
}

export const randomAvatar = () => {
  const animal = animals[Math.floor(Math.random() * animals.length)]
  const color = colors[Math.floor(Math.random() * colors.length)]
  return `${animal}-${color.replace('#', '')}`
}

export const avatarFromSeed = (seed: string) => {
  const [animal, colorHex] = seed.split('-')
  const icon = icons[animal] || 'USER'
  const color = `#${colorHex || '6c7ae0'}`
  return { icon, color }
}

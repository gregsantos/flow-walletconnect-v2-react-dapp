/* eslint-disable no-sequences */
export const yup = tag => d => (console.log(`${tag}`, d), d)
export const nope = tag => d => (console.error(`Oh No!! [${tag}]`, d), d)
export function serviceOfType(services = [], type) {
  return services.find(service => service.type === type)
}

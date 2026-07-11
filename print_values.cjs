for (const key of Object.keys(process.env)) {
  if (key.includes('API') || key.includes('KEY') || key.includes('TOKEN') || key.includes('SECRET')) {
    console.log(key, process.env[key] ? process.env[key].substring(0, 5) + '...' : 'empty');
  }
}

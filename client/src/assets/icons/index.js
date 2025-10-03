/** @format */

// Import all .svg files from the current directory
const svgFiles = import.meta.globEager('./*.svg')
const modules = {}

Object.keys(svgFiles).forEach(filePath => {
  // Extract the file name without extension
  const fileName = filePath.replace(/(\.\/|\.svg)/g, '')
  // Assign the default export of each file to the modules object
  modules[fileName] = svgFiles[filePath].default
})

export default modules

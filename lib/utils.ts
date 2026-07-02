
export const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const elem = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        elem.width = width
        elem.height = height
        const ctx = elem.getContext('2d')
        if (!ctx) {
            reject(new Error('Canvas context failure'))
            return
        }
        ctx.drawImage(img, 0, 0, width, height)
        
        // Force JPEG for better compression
        resolve(ctx.canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

const ASPECT_RATIO = 2 / 3 // width / height — book covers are always 2:3
const MAX_OUTPUT_WIDTH = 800

async function cropToCoverAspect(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap

  let cropWidth = width
  let cropHeight = width / ASPECT_RATIO
  if (cropHeight > height) {
    cropHeight = height
    cropWidth = height * ASPECT_RATIO
  }
  const sourceX = (width - cropWidth) / 2
  const sourceY = (height - cropHeight) / 2

  const outputWidth = Math.min(cropWidth, MAX_OUTPUT_WIDTH)
  const outputHeight = outputWidth / ASPECT_RATIO

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process that image.')
  ctx.drawImage(bitmap, sourceX, sourceY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process that image.'))),
      'image/jpeg',
      0.9,
    )
  })
}

interface CoverImageUploaderProps {
  previewUrl: string | null
  onChange: (blob: Blob | null, previewUrl: string | null) => void
}

function CoverImageUploader({ previewUrl, onChange }: CoverImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    try {
      const blob = await cropToCoverAspect(file)
      onChange(blob, URL.createObjectURL(blob))
    } catch {
      setError('Could not process that image.')
    }
  }

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    onChange(null, null)
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Cover image (optional)
      </Typography>
      <Box
        onClick={() => inputRef.current?.click()}
        sx={{
          position: 'relative',
          width: 140,
          aspectRatio: '2 / 3',
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          cursor: 'pointer',
          '&:hover': { borderColor: 'primary.main' },
        }}
      >
        {previewUrl ? (
          <Box
            component="img"
            src={previewUrl}
            alt="Cover preview"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <AddPhotoAlternateIcon color="action" fontSize="large" />
        )}
        {previewUrl && (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation()
              handleRemove()
            }}
            sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'background.paper' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}

export default CoverImageUploader

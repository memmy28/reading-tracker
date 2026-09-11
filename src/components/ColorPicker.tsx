import CheckIcon from '@mui/icons-material/Check'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import type { ColorOption } from '../lib/colors'

interface ColorPickerProps {
  colors: ColorOption[]
  value: string | null
  onChange: (colorId: string) => void
}

function ColorPicker({ colors, value, onChange }: ColorPickerProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 2,
        maxWidth: 240,
      }}
    >
      {colors.map((color) => {
        const selected = color.id === value
        return (
          <ButtonBase
            key={color.id}
            onClick={() => onChange(color.id)}
            aria-label={color.name}
            aria-pressed={selected}
            sx={{
              justifySelf: 'center',
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: color.hex,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: '2px solid',
              outlineColor: selected ? 'text.primary' : 'divider',
              outlineOffset: 2,
              transition: 'outline-color 0.15s ease',
            }}
          >
            {selected && <CheckIcon fontSize="small" sx={{ color: color.textColor }} />}
          </ButtonBase>
        )
      })}
    </Box>
  )
}

export default ColorPicker

import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'

interface CreatableAutocompleteProps {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
  loading?: boolean
  fullWidth?: boolean
  helperText?: string
}

function CreatableAutocomplete({
  label,
  options,
  value,
  onChange,
  loading,
  fullWidth = true,
  helperText,
}: CreatableAutocompleteProps) {
  return (
    <Autocomplete
      freeSolo
      fullWidth={fullWidth}
      options={options}
      value={value}
      loading={loading}
      onChange={(_event, newValue) => onChange(newValue ?? '')}
      onInputChange={(_event, newInputValue, reason) => {
        if (reason === 'input') onChange(newInputValue)
      }}
      renderInput={(params) => <TextField {...params} label={label} helperText={helperText} />}
    />
  )
}

export default CreatableAutocomplete

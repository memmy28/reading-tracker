import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'

interface CreatableMultiAutocompleteProps {
  label: string
  placeholder?: string
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  loading?: boolean
}

function CreatableMultiAutocomplete({
  label,
  placeholder,
  options,
  value,
  onChange,
  loading,
}: CreatableMultiAutocompleteProps) {
  return (
    <Autocomplete
      multiple
      freeSolo
      options={options}
      value={value}
      loading={loading}
      onChange={(_event, newValue) => onChange(newValue)}
      renderValue={(selected, getItemProps) =>
        selected.map((option, index) => {
          const { key, ...itemProps } = getItemProps({ index })
          return <Chip key={key} label={option} size="small" {...itemProps} />
        })
      }
      renderInput={(params) => <TextField {...params} label={label} placeholder={placeholder} />}
    />
  )
}

export default CreatableMultiAutocomplete

import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined'
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Container from '@mui/material/Container'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import ColorPicker from '../components/ColorPicker'
import CreatableAutocomplete from '../components/CreatableAutocomplete'
import CreatableMultiAutocomplete from '../components/CreatableMultiAutocomplete'
import CoverImageUploader from '../components/CoverImageUploader'
import type { ColorOption } from '../lib/colors'
import { fetchColors } from '../lib/colors'
import { ensureSession } from '../lib/ensureSession'
import { fetchLookupNames, findOrCreateLookup } from '../lib/lookups'
import { supabase } from '../lib/supabaseClient'
import { uploadCoverImage } from '../lib/uploadCover'

type FictionType = 'fiction' | 'nonfiction' | null
type Pace = 'slow' | 'medium' | 'fast' | null

interface BookFormState {
  title: string
  author: string
  series: string
  seriesNumber: string
  fictionType: FictionType
  genres: string[]
  publishingYear: string
  format: string
  source: string
  language: string
  pace: Pace
  owned: boolean
  accentColorId: string | null
  addToBookshelf: boolean
  startDate: string
  endDate: string
  rating: number | null
  ratingTears: number | null
  ratingHeart: number | null
  ratingChili: number | null
}

interface LookupOptions {
  authors: string[]
  series: string[]
  genres: string[]
  formats: string[]
  sources: string[]
  languages: string[]
}

const todayISO = () => new Date().toISOString().slice(0, 10)

const EMPTY_FORM: BookFormState = {
  title: '',
  author: '',
  series: '',
  seriesNumber: '',
  fictionType: 'fiction',
  genres: [],
  publishingYear: '',
  format: '',
  source: '',
  language: '',
  pace: null,
  owned: false,
  accentColorId: null,
  addToBookshelf: false,
  startDate: '',
  endDate: todayISO(),
  rating: null,
  ratingTears: null,
  ratingHeart: null,
  ratingChili: null,
}

const EMPTY_OPTIONS: LookupOptions = {
  authors: [],
  series: [],
  genres: [],
  formats: [],
  sources: [],
  languages: [],
}

function mergeUnique(existing: string[], addition: string | string[]): string[] {
  const items = Array.isArray(addition) ? addition : [addition]
  const set = new Set(existing)
  for (const item of items) {
    const trimmed = item.trim()
    if (trimmed) set.add(trimmed)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return 'Something went wrong while saving the book.'
}

function sanitizeLanguageCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
}

const ratingIcon = (emoji: string, faded = false) => (
  <span style={{ fontSize: 24, opacity: faded ? 0.35 : 1 }}>{emoji}</span>
)

function NewBookPage() {
  const [form, setForm] = useState<BookFormState>(EMPTY_FORM)
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [options, setOptions] = useState<LookupOptions>(EMPTY_OPTIONS)
  const [colors, setColors] = useState<ColorOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await ensureSession()
        const [authors, series, genres, formats, sources, languages, colorOptions] = await Promise.all([
          fetchLookupNames('authors'),
          fetchLookupNames('series'),
          fetchLookupNames('genres'),
          fetchLookupNames('formats'),
          fetchLookupNames('sources'),
          fetchLookupNames('languages'),
          fetchColors(),
        ])
        if (!cancelled) {
          setOptions({ authors, series, genres, formats, sources, languages })
          setColors(colorOptions)
          const defaultColor = colorOptions.find((c) => c.name === 'Gray')
          if (defaultColor) {
            setForm((prev) => (prev.accentColorId ? prev : { ...prev, accentColorId: defaultColor.id }))
          }
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err))
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
    }
  }, [coverPreviewUrl])

  const handleField =
    (field: 'title' | 'seriesNumber' | 'publishingYear' | 'startDate' | 'endDate') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter') return
    const target = event.target as HTMLElement
    if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return
    event.preventDefault()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    const title = form.title.trim()
    if (!title) {
      setError('Title is required.')
      return
    }

    setSubmitting(true)
    try {
      const session = await ensureSession()
      if (!session) throw new Error('Could not establish a session to save the book under.')
      const userId = session.user.id

      const [authorId, seriesId, formatId, sourceId, languageId] = await Promise.all([
        form.author.trim() ? findOrCreateLookup('authors', form.author, userId) : Promise.resolve(null),
        form.series.trim() ? findOrCreateLookup('series', form.series, userId) : Promise.resolve(null),
        form.format.trim() ? findOrCreateLookup('formats', form.format, userId) : Promise.resolve(null),
        form.source.trim() ? findOrCreateLookup('sources', form.source, userId) : Promise.resolve(null),
        form.language.trim() ? findOrCreateLookup('languages', form.language, userId) : Promise.resolve(null),
      ])

      const genreNames = Array.from(new Set(form.genres.map((g) => g.trim()).filter(Boolean)))
      const genreIds = await Promise.all(
        genreNames.map((name) => findOrCreateLookup('genres', name, userId)),
      )

      let coverUrl: string | null = null
      if (coverBlob) {
        coverUrl = await uploadCoverImage(coverBlob, userId)
      }

      const { data: book, error: insertError } = await supabase
        .from('books')
        .insert({
          user_id: userId,
          title,
          cover_url: coverUrl,
          author_id: authorId,
          series_id: seriesId,
          series_number: form.seriesNumber ? Number(form.seriesNumber) : null,
          is_fiction:
            form.fictionType === 'fiction' ? true : form.fictionType === 'nonfiction' ? false : null,
          publishing_year: form.publishingYear ? Number(form.publishingYear) : null,
          format_id: formatId,
          source_id: sourceId,
          language_id: languageId,
          pace: form.pace,
          owned: form.owned,
          accent_color_id: form.accentColorId,
          status: form.addToBookshelf ? 'read' : 'tbr',
          started_at: form.addToBookshelf && form.startDate ? form.startDate : null,
          finished_at: form.addToBookshelf ? form.endDate || null : null,
          rating: form.addToBookshelf ? form.rating : null,
          rating_tears: form.addToBookshelf ? form.ratingTears : null,
          rating_heart: form.addToBookshelf ? form.ratingHeart : null,
          rating_chili: form.addToBookshelf ? form.ratingChili : null,
        })
        .select('id')
        .single()
      if (insertError) throw insertError

      if (genreIds.length > 0) {
        const { error: genreLinkError } = await supabase
          .from('book_genres')
          .insert(genreIds.map((genreId) => ({ book_id: book.id as string, genre_id: genreId })))
        if (genreLinkError) throw genreLinkError
      }

      setOptions((prev) => ({
        authors: mergeUnique(prev.authors, form.author),
        series: mergeUnique(prev.series, form.series),
        genres: mergeUnique(prev.genres, genreNames),
        formats: mergeUnique(prev.formats, form.format),
        sources: mergeUnique(prev.sources, form.source),
        languages: mergeUnique(prev.languages, form.language),
      }))

      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
      const defaultColorId = colors.find((c) => c.name === 'Gray')?.id ?? null
      setForm({ ...EMPTY_FORM, accentColorId: defaultColorId })
      setCoverBlob(null)
      setCoverPreviewUrl(null)
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Add a new book
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Add a book to your library, whether it's on your TBR, in progress, or finished.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} noValidate>
        {success && (
          <Alert severity="success" onClose={() => setSuccess(false)} sx={{ mb: 3 }}>
            Book saved successfully.
          </Alert>
        )}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
          <Typography variant="h6" gutterBottom>
            General information
          </Typography>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <CoverImageUploader
                previewUrl={coverPreviewUrl}
                onChange={(blob, previewUrl) => {
                  setCoverBlob(blob)
                  setCoverPreviewUrl(previewUrl)
                }}
              />
              <Stack spacing={3} sx={{ flex: 1, width: '100%' }}>
                <TextField
                  label="Title"
                  value={form.title}
                  onChange={handleField('title')}
                  required
                  fullWidth
                  autoFocus
                />
                <CreatableAutocomplete
                  label="Author"
                  options={options.authors}
                  value={form.author}
                  onChange={(value) => setForm((prev) => ({ ...prev, author: value }))}
                  loading={loadingOptions}
                />
              </Stack>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 2 }}>
                <CreatableAutocomplete
                  label="Series"
                  options={options.series}
                  value={form.series}
                  onChange={(value) => setForm((prev) => ({ ...prev, series: value }))}
                  loading={loadingOptions}
                />
              </Box>
              <TextField
                label="# in series"
                type="number"
                value={form.seriesNumber}
                onChange={handleField('seriesNumber')}
                sx={{ flex: 1 }}
                slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
              />
            </Stack>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Fiction or non-fiction
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={form.fictionType}
                onChange={(_event, value: FictionType) =>
                  setForm((prev) => ({ ...prev, fictionType: value }))
                }
              >
                <ToggleButton value="fiction">Fiction</ToggleButton>
                <ToggleButton value="nonfiction">Non-fiction</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <CreatableMultiAutocomplete
              label="Genres"
              placeholder="Add a genre"
              options={options.genres}
              value={form.genres}
              onChange={(value) => setForm((prev) => ({ ...prev, genres: value }))}
              loading={loadingOptions}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Publishing year"
                type="number"
                value={form.publishingYear}
                onChange={handleField('publishingYear')}
                fullWidth
                slotProps={{ htmlInput: { min: 0, max: 3000 } }}
              />
              <CreatableAutocomplete
                label="Language"
                options={options.languages}
                value={form.language}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, language: sanitizeLanguageCode(value) }))
                }
                loading={loadingOptions}
                helperText="2-letter code, e.g. EN"
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <CreatableAutocomplete
                label="Format"
                options={options.formats}
                value={form.format}
                onChange={(value) => setForm((prev) => ({ ...prev, format: value }))}
                loading={loadingOptions}
              />
              <CreatableAutocomplete
                label="From"
                options={options.sources}
                value={form.source}
                onChange={(value) => setForm((prev) => ({ ...prev, source: value }))}
                loading={loadingOptions}
              />
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Pace
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={form.pace}
                  onChange={(_event, value: Pace) => setForm((prev) => ({ ...prev, pace: value }))}
                >
                  <ToggleButton value="slow">Slow</ToggleButton>
                  <ToggleButton value="medium">Medium</ToggleButton>
                  <ToggleButton value="fast">Fast</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={form.owned}
                    onChange={(_event, checked) => setForm((prev) => ({ ...prev, owned: checked }))}
                  />
                }
                label="I own this book"
              />
            </Stack>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Accent color
              </Typography>
              <ColorPicker
                colors={colors}
                value={form.accentColorId}
                onChange={(colorId) => setForm((prev) => ({ ...prev, accentColorId: colorId }))}
              />
            </Box>
          </Stack>
        </Paper>

        <Box sx={{ mt: 3 }}>
          <Button
            type="button"
            variant={form.addToBookshelf ? 'contained' : 'outlined'}
            color={form.addToBookshelf ? 'success' : 'primary'}
            startIcon={form.addToBookshelf ? <BookmarkAddedIcon /> : <BookmarkAddOutlinedIcon />}
            onClick={() => setForm((prev) => ({ ...prev, addToBookshelf: !prev.addToBookshelf }))}
          >
            {form.addToBookshelf ? 'Added to bookshelf' : 'Add to bookshelf'}
          </Button>
        </Box>

        <Collapse in={form.addToBookshelf} unmountOnExit>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 }, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bookshelf details
            </Typography>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Start date"
                  type="date"
                  value={form.startDate}
                  onChange={handleField('startDate')}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="End date"
                  type="date"
                  value={form.endDate}
                  onChange={handleField('endDate')}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Overall rating
                </Typography>
                <Rating
                  value={form.rating}
                  onChange={(_event, value) => setForm((prev) => ({ ...prev, rating: value }))}
                />
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Tears
                  </Typography>
                  <Rating
                    value={form.ratingTears}
                    onChange={(_event, value) => setForm((prev) => ({ ...prev, ratingTears: value }))}
                    icon={ratingIcon('💧')}
                    emptyIcon={ratingIcon('💧', true)}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Romance
                  </Typography>
                  <Rating
                    value={form.ratingHeart}
                    onChange={(_event, value) => setForm((prev) => ({ ...prev, ratingHeart: value }))}
                    icon={ratingIcon('❤️')}
                    emptyIcon={ratingIcon('❤️', true)}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Spice
                  </Typography>
                  <Rating
                    value={form.ratingChili}
                    onChange={(_event, value) => setForm((prev) => ({ ...prev, ratingChili: value }))}
                    icon={ratingIcon('🌶️')}
                    emptyIcon={ratingIcon('🌶️', true)}
                  />
                </Box>
              </Stack>
            </Stack>
          </Paper>
        </Collapse>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{ mt: 4 }}
        >
          {submitting ? 'Saving…' : 'Save book'}
        </Button>
      </Box>
    </Container>
  )
}

export default NewBookPage

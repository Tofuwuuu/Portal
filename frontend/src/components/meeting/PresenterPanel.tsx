import { useRef, useState, type ChangeEvent } from 'react'
import {
  normalizePresenterUrl,
  readImageFileAsSlide,
  type PresenterSlide,
  type PresenterState,
  type PresenterUpdateAction,
} from '../../utils/presenter'

interface PresenterPanelProps {
  state: PresenterState
  isTeacher: boolean
  onUpdate: (action: PresenterUpdateAction) => void
}

type AddMode = 'none' | 'url' | 'text'

export default function PresenterPanel({ state, isTeacher, onUpdate }: PresenterPanelProps) {
  const [addMode, setAddMode] = useState<AddMode>('none')
  const [urlInput, setUrlInput] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [textBody, setTextBody] = useState('')
  const [formError, setFormError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasSlides = state.slides.length > 0
  const slide = hasSlides ? state.slides[state.currentIndex] : null

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFormError('Please choose an image file (PNG or JPG).')
      return
    }

    try {
      const newSlide = await readImageFileAsSlide(file)
      onUpdate({ action: 'add-slide', slide: newSlide })
      setFormError('')
    } catch {
      setFormError('Could not read that image.')
    }
  }

  const handleAddUrl = () => {
    const normalized = normalizePresenterUrl(urlInput)
    if (!normalized) {
      setFormError('Enter a valid web address.')
      return
    }
    onUpdate({ action: 'add-slide', slide: { type: 'url', url: normalized } })
    setUrlInput('')
    setAddMode('none')
    setFormError('')
  }

  const handleAddText = () => {
    if (!textTitle.trim() && !textBody.trim()) {
      setFormError('Add a title or body for the text slide.')
      return
    }
    onUpdate({
      action: 'add-slide',
      slide: { type: 'text', title: textTitle.trim(), body: textBody.trim() },
    })
    setTextTitle('')
    setTextBody('')
    setAddMode('none')
    setFormError('')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-700/60 bg-slate-900/70 px-4 py-2 text-xs text-slate-300">
        <span className="font-medium text-white">
          {isTeacher ? 'You are presenting' : "Following teacher's presentation"}
        </span>
        {hasSlides && (
          <span>
            Slide {state.currentIndex + 1} / {state.slides.length}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-slate-950">
        {!slide ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-sm text-slate-400">
              {isTeacher
                ? 'No slides yet — add an image, link, or text slide below.'
                : "Waiting for the teacher to add content…"}
            </p>
          </div>
        ) : (
          <PresenterSlideView slide={slide} />
        )}
      </div>

      {isTeacher && (
        <div className="border-t border-slate-700 bg-slate-900 px-4 py-3">
          {formError && <p className="mb-2 text-center text-xs text-red-400">{formError}</p>}

          {addMode === 'url' && (
            <div className="mb-3 flex flex-wrap gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/lesson"
                className="input-field min-w-[200px] flex-1 bg-slate-800 text-white"
              />
              <button type="button" onClick={handleAddUrl} className="btn-primary">
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddMode('none')}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          )}

          {addMode === 'text' && (
            <div className="mb-3 space-y-2">
              <input
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Title"
                className="input-field bg-slate-800 text-white"
              />
              <textarea
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
                placeholder="Body text"
                rows={3}
                className="input-field bg-slate-800 text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddMode('none')}
                  className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button type="button" onClick={handleAddText} className="btn-primary">
                  Add slide
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdate({ action: 'set-index', index: Math.max(0, state.currentIndex - 1) })
              }
              disabled={!hasSlides || state.currentIndex === 0}
              className="rounded-full bg-slate-700 px-3 py-1.5 text-sm text-white disabled:opacity-40"
            >
              &lsaquo; Previous
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  action: 'set-index',
                  index: Math.min(state.slides.length - 1, state.currentIndex + 1),
                })
              }
              disabled={!hasSlides || state.currentIndex >= state.slides.length - 1}
              className="rounded-full bg-slate-700 px-3 py-1.5 text-sm text-white disabled:opacity-40"
            >
              Next &rsaquo;
            </button>

            <span className="mx-1 h-6 w-px bg-slate-700" />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
            >
              Add image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => void handleFileChange(e)}
            />
            <button
              type="button"
              onClick={() => setAddMode(addMode === 'url' ? 'none' : 'url')}
              className="rounded-full bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
            >
              Add link
            </button>
            <button
              type="button"
              onClick={() => setAddMode(addMode === 'text' ? 'none' : 'text')}
              className="rounded-full bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
            >
              Add text slide
            </button>
            {hasSlides && (
              <button
                type="button"
                onClick={() => onUpdate({ action: 'remove-slide', index: state.currentIndex })}
                className="rounded-full bg-red-600/80 px-3 py-1.5 text-sm text-white hover:bg-red-600"
              >
                Remove slide
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PresenterSlideView({ slide }: { slide: PresenterSlide }) {
  if (slide.type === 'image') {
    return (
      <div className="flex h-full items-center justify-center p-2">
        <img
          src={slide.src}
          alt={slide.name || 'Presenter slide'}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    )
  }

  if (slide.type === 'url') {
    return (
      <div className="relative h-full w-full bg-white">
        <iframe
          key={slide.url}
          src={slide.url}
          title="Presenter content"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="no-referrer"
          className="h-full w-full border-0"
        />
        <a
          href={slide.url}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
        >
          Open in new tab ↗
        </a>
        <p className="absolute bottom-2 left-2 max-w-[60%] rounded-md bg-black/50 px-2 py-1 text-[11px] text-slate-200">
          Some sites block embedding — use "Open in new tab" if the page stays blank.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-white px-10 text-center">
      {slide.title && <h2 className="text-2xl font-bold text-slate-900">{slide.title}</h2>}
      {slide.body && (
        <p className="max-w-2xl whitespace-pre-wrap text-base text-slate-700">{slide.body}</p>
      )}
      {!slide.title && !slide.body && <p className="text-sm text-slate-400">Empty slide</p>}
    </div>
  )
}

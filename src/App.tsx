import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import './App.css'
import { BottomNav } from './components/BottomNav'
import type { Tab } from './components/BottomNav'
import { InstallAppBanner } from './components/InstallAppBanner'
import { Banner, BannerActionButton } from './components/ui'
import { HistoryScreen } from './features/voice/HistoryScreen'
import { RangeScreen } from './features/voice/RangeScreen'
import { RecordScreen } from './features/voice/RecordScreen'
import { usePitchMonitor } from './features/voice/usePitchMonitor'
import { useVoiceReadings } from './features/voice/useVoiceReadings'
import { APP_VERSION } from './version'

export default function App() {
  const [tab, setTab] = useState<Tab>('record')
  const [updateReady, setUpdateReady] = useState(false)
  const [applyUpdate, setApplyUpdate] = useState<((reloadPage?: boolean) => Promise<void>) | null>(
    null,
  )

  const readings = useVoiceReadings()
  const monitor = usePitchMonitor()

  useEffect(() => {
    const onUpdateAvailable = (
      event: Event & { detail?: { updateSW?: (reloadPage?: boolean) => Promise<void> } },
    ) => {
      if (!event.detail?.updateSW) return
      setApplyUpdate(() => event.detail!.updateSW!)
      setUpdateReady(true)
    }

    window.addEventListener('my-voice:update-available', onUpdateAvailable as EventListener)
    return () => {
      window.removeEventListener('my-voice:update-available', onUpdateAvailable as EventListener)
    }
  }, [])

  const goToRecord = () => setTab('record')

  return (
    <div className="app">
      <main className="app__main">
        <InstallAppBanner />

        {updateReady && applyUpdate && (
          <Banner
            icon={<RefreshCw size={18} aria-hidden />}
            onDismiss={() => setUpdateReady(false)}
            dismissLabel="Dismiss update prompt"
            action={<BannerActionButton onClick={() => void applyUpdate(true)}>Update</BannerActionButton>}
          >
            A new version is ready. Update now to get the latest fixes.
          </Banner>
        )}

        {tab === 'record' && <RecordScreen monitor={monitor} readings={readings} />}
        {tab === 'range' && <RangeScreen data={readings.data} onRecord={goToRecord} />}
        {tab === 'history' && (
          <HistoryScreen
            data={readings.data}
            onDelete={readings.deleteReading}
            onRecord={goToRecord}
          />
        )}

        <p className="app__version">My Voice v{APP_VERSION}</p>
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

import chatbox2 from '../../music/chatbox-2.wav'
import chatbox3 from '../../music/chatbox-3.wav'
import chatbox4 from '../../music/chatbox-4.wav'
import chatbox5 from '../../music/chatbox-5.wav'
import snapSound from '../../music/SE_snap.ogg'

export const dialogueSounds = [chatbox2, chatbox3, chatbox4, chatbox5]
export const dialogueDurations = [1.043, 1.290, 1.064, 1.589]
let context: AudioContext | undefined
const buffers = new Map<string, Promise<AudioBuffer>>()
let mobileRecoveryInstalled = false

function recoverMobileAudio() {
  if (!context || context.state === 'running' || context.state === 'closed') return
  void context.resume().catch((error: unknown) => console.error('Unable to resume sound effects', error))
}


export function preloadSound(url: string) {
  context ??= new AudioContext()
  let pending = buffers.get(url)
  if (!pending) {
    const audioContext = context
    pending = fetch(url).then(response => {
      if (!response.ok) throw new Error(`Sound request failed: ${response.status}`)
      return response.arrayBuffer()
    }).then(bytes => audioContext.decodeAudioData(bytes))
    buffers.set(url, pending)
  }
  return pending
}

export function unlockAudio() {
  context ??= new AudioContext()
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches && !mobileRecoveryInstalled) {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) {
      try { session.type = 'playback' }
      catch (error) { console.error('Unable to configure sound effects playback', error) }
    }
    // iOS authorizes audio on touchend/click, not on an asynchronous effect callback.
    window.addEventListener('touchend', recoverMobileAudio, { capture: true, passive: true })
    window.addEventListener('click', recoverMobileAudio, { capture: true })
    mobileRecoveryInstalled = true
  }
  return context.resume()
}

async function createSound(url: string) {
  const buffer = await preloadSound(url)
  await unlockAudio()
  const source = context!.createBufferSource()
  source.buffer = buffer
  source.connect(context!.destination)
  source.onended = () => source.disconnect()
  return source
}

export function playDialogueSound(index: number) {
  return createSound(dialogueSounds[index])
}

export async function playSnapSound() {
  const source = await createSound(snapSound)
  source.start()
}

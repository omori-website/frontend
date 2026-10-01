import chatbox2 from '../../music/chatbox-2.wav'
import chatbox3 from '../../music/chatbox-3.wav'
import chatbox4 from '../../music/chatbox-4.wav'
import chatbox5 from '../../music/chatbox-5.wav'
import snapSound from '../../music/SE_snap.ogg'

export const dialogueSounds = [chatbox2, chatbox3, chatbox4, chatbox5]
export const dialogueDurations = [1.043, 1.290, 1.064, 1.589]
let context: AudioContext | undefined
const buffers = new Map<string, Promise<AudioBuffer>>()

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

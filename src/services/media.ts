import { api, json } from './api'

export interface MediaItem {
  id: string
  name: string
  mimeType: string
  size: number
  purpose: string
  resourceId: string
  ownerId: string
  createdAt: string
  feedback: {
    id: string
    text: string
    authorName?: string
    createdAt: string
  }[]
}

export async function uploadFile(
  file: File,
  purpose: string,
  resourceId: string,
) {
  if (file.size > 3 * 1024 * 1024) {
    const { upload } = await api<{
      upload: { id: string; partSize: number; parts: number }
    }>(
      '/media/uploads',
      json('POST', {
        purpose,
        resourceId,
        name: file.name,
        mimeType: file.type,
        size: file.size,
      }),
    )
    try {
      for (let part = 0; part < upload.parts; part++) {
        await api(`/media/uploads/${upload.id}/parts/${part}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: file.slice(
            part * upload.partSize,
            (part + 1) * upload.partSize,
          ),
        })
      }
      return await api<{ media: MediaItem }>(
        `/media/uploads/${upload.id}/complete`,
        json('POST', {}),
      )
    } catch (error) {
      await api(`/media/uploads/${upload.id}`, { method: 'DELETE' }).catch(
        () => undefined,
      )
      throw error
    }
  }
  const body = new FormData()
  body.append('file', file)
  return api<{ media: MediaItem }>(
    `/media?purpose=${purpose}&resourceId=${encodeURIComponent(resourceId)}`,
    { method: 'POST', body },
  )
}

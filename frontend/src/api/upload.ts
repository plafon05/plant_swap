import http from './client'

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)

  const res = await http.post<{ url: string }>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.url
}
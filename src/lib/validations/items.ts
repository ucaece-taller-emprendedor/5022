import { z } from 'zod'

// Colección de ejemplo "items". Reemplazala por los datos de tu startup (y ajustá firestore.rules).
export const itemSchema = z.object({
  titulo: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres.').max(100, 'Máximo 100 caracteres.'),
  descripcion: z.string().trim().min(10, 'Contá un poco más (mínimo 10 caracteres).').max(1000, 'Máximo 1000 caracteres.'),
  publicado: z.preprocess(v => v === 'on' || v === 'true' || v === true, z.boolean()),
})
export type ItemForm = z.infer<typeof itemSchema>

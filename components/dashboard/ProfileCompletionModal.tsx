"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COUNTRIES } from '@/lib/countries'
import { useUser } from '@clerk/nextjs'

export default function ProfileCompletionModal() {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [gender, setGender] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [nationality, setNationality] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const pm: any = user?.publicMetadata || {}
    const isComplete = Boolean(pm?.gender && pm?.age && pm?.nationality)
    if (!user) return
    // Show modal if just signed in (or first time) and profile incomplete
    setOpen(!isComplete)
    if (pm?.gender) setGender(String(pm.gender))
    if (pm?.age) setAge(Number(pm.age))
    if (pm?.nationality) setNationality(String(pm.nationality))
  }, [user])

  async function onSubmit() {
    if (!gender || !age || !nationality) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender, age: Number(age), nationality }),
      })
      if (res.ok) setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complétez votre profil</DialogTitle>
          <DialogDescription>
            Pour personnaliser votre expérience, renseignez ces informations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="text-sm font-medium">Genre</div>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculin</SelectItem>
                <SelectItem value="female">Féminin</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
                <SelectItem value="prefer_not_to_say">Préférez ne pas répondre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Âge</div>
            <Input type="number" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')} />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Nationalité</div>
            <Select value={nationality} onValueChange={setNationality}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un pays" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>Plus tard</Button>
            <Button onClick={onSubmit} disabled={submitting || !gender || !age || !nationality}>Enregistrer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}



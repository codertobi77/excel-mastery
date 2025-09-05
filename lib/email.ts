// Simple email service for payment notifications

export interface PaymentEmailData {
  userEmail: string
  userName: string
  amount: number
  currency: string
  interval: string
  trialDays?: number
  paymentId: string
  paymentUrl?: string
}

export async function sendPaymentInstructions(data: PaymentEmailData) {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const emailContent = {
      from: 'Excel Mastery AI <noreply@excelmastery.ai>',
      to: [data.userEmail],
      subject: `Instructions de paiement - Excel Mastery Pro`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #166534;">Instructions de paiement</h2>
          
          <p>Bonjour ${data.userName},</p>
          
          <p>Votre paiement pour Excel Mastery Pro a été initialisé avec succès.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Détails du paiement</h3>
            <p><strong>Montant:</strong> ${data.amount} ${data.currency}</p>
            <p><strong>Période:</strong> ${data.interval === 'year' ? 'Annuel (2 mois offerts)' : 'Mensuel'}</p>
            ${data.trialDays ? `<p><strong>Essai gratuit:</strong> ${data.trialDays} jours</p>` : ''}
            <p><strong>ID de paiement:</strong> ${data.paymentId}</p>
          </div>
          
          <h3>Comment procéder au paiement:</h3>
          <ol>
            <li>Utilisez l'une des méthodes de paiement suivantes :</li>
            <ul>
              <li>Mobile Money (Orange Money, MTN Money, etc.)</li>
              <li>Virement bancaire</li>
              <li>Carte bancaire</li>
              <li>Cryptomonnaies</li>
            </ul>
            <li>Une fois le paiement effectué, votre compte sera automatiquement mis à jour</li>
            <li>Vous recevrez une confirmation par email</li>
          </ol>
          
          ${data.paymentUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.paymentUrl}" style="background: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Finaliser le paiement
              </a>
            </div>
          ` : ''}
          
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          
          <p>Cordialement,<br>L'équipe Excel Mastery AI</p>
        </div>
      `
    }
    
    console.log('Sending payment email via Resend:', {
      to: data.userEmail,
      subject: emailContent.subject,
      paymentId: data.paymentId
    })
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailContent),
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorData
      })
      return { success: false, error: `Email service error: ${response.status}` }
    }
    
    const result = await response.json()
    console.log('Email sent successfully via Resend:', result)
    
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('Failed to send payment email via Resend:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

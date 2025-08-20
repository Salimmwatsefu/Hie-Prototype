import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '../utils/formatCurrency'

export default function FeaturedCaseModal({ fraudCase, onClose }) {
  if (!fraudCase) return null

  return (
    <Dialog open={!!fraudCase} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Featured Case Analysis: {fraudCase.patient_id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          <p><strong>Fraud Type:</strong> {fraudCase.fraud_type}</p>
          <p><strong>Confidence:</strong> {(fraudCase.fraud_confidence * 100).toFixed(1)}%</p>
          <p><strong>Total Amount:</strong> {formatCurrency(fraudCase.total_amount)}</p>
          <p><strong>Procedures:</strong> {fraudCase.procedure_count}</p>
          <p><strong>Hospitals Involved:</strong> {fraudCase.hospital_count}</p>
          <p><strong>Risk Level:</strong> {fraudCase.risk_level}</p>
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

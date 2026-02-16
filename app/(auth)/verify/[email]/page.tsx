import VerifyAccountForm from '@/src/features/auth/components/VerifyAccountForm/VerifyAccountForm'
import React from 'react'

export const metadata = {
  title: "KOSH | Verify Account",
};

const VerifyEmail = () => {
  return (
    <div>
      <VerifyAccountForm />
    </div>
  )
}

export default VerifyEmail

declare module 'react-phone-number-input' {
  import { ComponentType } from 'react'
  
  export interface PhoneInputProps {
    value?: string
    onChange?: (value: string | undefined) => void
    placeholder?: string
    disabled?: boolean
    defaultCountry?: string
    countries?: string[]
    international?: boolean
    className?: string
    inputComponent?: ComponentType<any>
  }
  
  const PhoneInput: ComponentType<PhoneInputProps>
  export default PhoneInput
}
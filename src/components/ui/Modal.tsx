import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, CheckCircle } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  confirmationNumber: string
  name: string
  date: string
  time: string
  service: string
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  confirmationNumber,
  name,
  date,
  time,
  service,
}: ConfirmationModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-brand-blue/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md bg-brand-lino p-8 text-center relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-brand-bruma hover:text-brand-blue transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="flex justify-center mb-6">
                  <CheckCircle className="text-brand-oliva" size={56} strokeWidth={1.5} />
                </div>

                <Dialog.Title
                  as="h3"
                  className="font-cormorant text-2xl font-light tracking-widest text-brand-blue uppercase mb-2"
                >
                  ¡Cita Confirmada!
                </Dialog.Title>

                <p className="font-opensans text-sm text-brand-tierra mb-6">
                  Gracias, {name}. Nos vemos pronto.
                </p>

                <div className="border border-brand-arena p-4 mb-6 text-left space-y-2">
                  <div className="flex justify-between text-sm font-opensans">
                    <span className="text-brand-bruma uppercase tracking-wider text-xs">Número de cita</span>
                    <span className="text-brand-blue font-medium">{confirmationNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm font-opensans">
                    <span className="text-brand-bruma uppercase tracking-wider text-xs">Servicio</span>
                    <span className="text-brand-tierra text-right max-w-[60%]">{service}</span>
                  </div>
                  <div className="flex justify-between text-sm font-opensans">
                    <span className="text-brand-bruma uppercase tracking-wider text-xs">Fecha</span>
                    <span className="text-brand-tierra">{date}</span>
                  </div>
                  <div className="flex justify-between text-sm font-opensans">
                    <span className="text-brand-bruma uppercase tracking-wider text-xs">Hora</span>
                    <span className="text-brand-tierra">{time}</span>
                  </div>
                </div>

                <p className="font-opensans text-xs text-brand-bruma mb-6">
                  Recibirás una confirmación. Ante cualquier consulta, comunícate al{' '}
                  <a href="tel:+50670278704" className="text-brand-tierra hover:underline">
                    7027-8704
                  </a>
                </p>

                <button
                  onClick={onClose}
                  className="w-full bg-brand-blue text-brand-lino font-opensans text-xs tracking-widest uppercase py-3 hover:bg-brand-tierra transition-colors duration-300"
                >
                  Cerrar
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import Services from '../components/sections/Services'
import Booking from '../components/sections/Booking'
import Reviews from '../components/sections/Reviews'

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-lino">
      <Header />
      <main>
        <Hero />
        <Services />
        <Booking />
        <Reviews />
      </main>
      <Footer />
    </div>
  )
}

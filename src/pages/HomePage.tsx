import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Features from '../components/Features';
import AboutUs from '../components/AboutUs';
import Testimonials from '../components/Testimonials';

const HomePage: React.FC = () => {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Features />
        <AboutUs />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;

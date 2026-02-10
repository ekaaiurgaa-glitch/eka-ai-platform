import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="bg-background shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-text-primary font-heading">
            YourLogo
          </div>
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-text-secondary hover:text-primary transition"
              >
                {link.name}
              </a>
            ))}
            <a
              href="/login"
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition"
            >
              Get Started
            </a>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-background-alt">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-primary hover:bg-gray-50"
              >
                {link.name}
              </a>
            ))}
            <a
              href="/login"
              className="block bg-primary text-white px-3 py-2 rounded-md text-base font-medium"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
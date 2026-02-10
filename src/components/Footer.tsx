import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  const socialLinks = [
    { icon: <Facebook size={20} />, href: '#' },
    { icon: <Twitter size={20} />, href: '#' },
    { icon: <Instagram size={20} />, href: '#' },
    { icon: <Linkedin size={20} />, href: '#' },
  ];

  const footerLinks = [
    { title: 'Solutions', links: ['Marketing', 'Analytics', 'Commerce', 'Insights'] },
    { title: 'Support', links: ['Pricing', 'Documentation', 'Guides', 'API Status'] },
    { title: 'Company', links: ['About', 'Blog', 'Jobs', 'Press', 'Partners'] },
    { title: 'Legal', links: ['Claim', 'Privacy', 'Terms'] },
  ];

  return (
    <footer className="bg-background-alt">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{section.title}</h3>
              <ul className="mt-4 space-y-4">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-base text-text-secondary hover:text-primary">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between">
          <div className="flex space-x-6">
            {socialLinks.map((social, index) => (
              <a key={index} href={social.href} className="text-text-secondary hover:text-primary">
                {social.icon}
              </a>
            ))}
          </div>
          <p className="mt-8 md:mt-0 text-base text-text-secondary">
            &copy; {new Date().getFullYear()} Your Company, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

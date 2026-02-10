import React from 'react';

const Footer: React.FC = () => {
  const footerLinks = [
    { title: 'Company', links: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ]},
    { title: 'Legal', links: [
      { name: 'Privacy Policy', href: '/legal#privacy' },
      { name: 'Terms of Service', href: '/legal#terms' },
      { name: 'Dispute Resolution', href: '/legal#dispute' },
    ]},
    { title: 'Support', links: [
      { name: 'Documentation', href: '/docs' },
      { name: 'Help Center', href: '/help' },
    ]},
  ];

  return (
    <footer className="bg-white border-t border-black">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-black uppercase tracking-wider">{section.title}</h3>
              <ul className="mt-4 space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-base text-black hover:text-brand-orange">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-black flex flex-col md:flex-row items-center justify-between">
          <p className="text-base text-black">
            &copy; {new Date().getFullYear()} Go4Garage Private Limited. All rights reserved.
          </p>
          <p className="mt-4 md:mt-0 text-sm text-black">
            Powered by <span className="text-brand-orange font-bold">EKA-AI</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

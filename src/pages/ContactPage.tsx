import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const ContactPage: React.FC = () => {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold font-heading leading-tight">
            Contact Us
          </h1>
          <p className="mt-4 text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
            We would love to hear from you. Please fill out the form below or use the contact details to get in touch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold font-heading mb-6">Get in Touch</h2>
            <form>
              <div className="mb-4">
                <label htmlFor="name" className="block text-text-secondary mb-2">Name</label>
                <input type="text" id="name" className="w-full p-3 border rounded-lg bg-background-alt" />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-text-secondary mb-2">Email</label>
                <input type="email" id="email" className="w-full p-3 border rounded-lg bg-background-alt" />
              </div>
              <div className="mb-4">
                <label htmlFor="subject" className="block text-text-secondary mb-2">Subject</label>
                <input type="text" id="subject" className="w-full p-3 border rounded-lg bg-background-alt" />
              </div>
              <div className="mb-4">
                <label htmlFor="message" className="block text-text-secondary mb-2">Message</label>
                <textarea id="message" rows={5} className="w-full p-3 border rounded-lg bg-background-alt"></textarea>
              </div>
              <button type="submit" className="bg-primary text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-opacity-90 transition">
                Send Message
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading mb-6">Contact Information</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <MapPin className="text-primary w-6 h-6 mr-4 mt-1" />
                <div>
                  <h3 className="font-semibold">Address</h3>
                  <p className="text-text-secondary">123 Main Street, Anytown, USA 12345</p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="text-primary w-6 h-6 mr-4 mt-1" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-text-secondary">contact@yourcompany.com</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="text-primary w-6 h-6 mr-4 mt-1" />
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <p className="text-text-secondary">+1 (555) 123-4567</p>
                </div>
              </div>
            </div>
            <div className="mt-8">
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Google Map will be here</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

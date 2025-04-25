import React from 'react';
import { Facebook, Twitter, Instagram, CreditCard } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-dark text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">About Me</h3>
            <p className="text-primary-light">
              Carol Store is your destination for quality fashion and accessories.
              We pride ourselves on offering unique pieces at affordable prices.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Follow Me</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-primary-light hover:text-gray-600">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-primary-light hover:text-gray-600">
                <Twitter size={24} />
              </a>
              <a href="#" className="text-primary-light hover:text-gray-600">
                <Instagram size={24} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-primary-light hover:text-gray-600">About Us</a>
              </li>
              <li>
                <a href="#" className="text-primary-light hover:text-gray-600">Contact</a>
              </li>
              <li>
                <a href="#" className="text-primary-light hover:text-gray-600">Shipping Policy</a>
              </li>
              <li>
                <a href="#" className="text-primary-light hover:text-gray-600">Returns</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-primary-light">Payment Methods</p>
              <div className="flex items-center mt-2">
                <img
                  src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"
                  alt="PayPal"
                  className="h-6"
                />
              </div>
            </div>
            <p className="text-primary-light">
              Copyright © 2025 Compulsiva Store
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
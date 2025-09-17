
import React, { useState } from 'react';
import { FAQ_ITEMS } from '../constants';
import { ChevronDownIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface FAQItemProps {
  item: {
    question: string;
    answer: string;
  };
}

const FAQItem: React.FC<FAQItemProps> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-6"
      >
        <span className="text-lg font-semibold text-brand-dark">{item.question}</span>
        <ChevronDownIcon className={`w-6 h-6 text-brand-gray transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <p className="text-brand-gray pb-6 pr-6">
          {item.answer}
        </p>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  const { language, t } = useLanguage();
  const faqItems = FAQ_ITEMS[language];

  return (
    <section id="faq" className="py-20 bg-brand-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark">{t.faqTitle}</h2>
          <p className="text-lg text-brand-gray mt-4 max-w-2xl mx-auto">{t.faqSubtitle}</p>
        </div>
        <div className="max-w-3xl mx-auto bg-white p-4 sm:p-8 rounded-xl border border-gray-200">
          {faqItems.map((item, index) => (
            <FAQItem key={index} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
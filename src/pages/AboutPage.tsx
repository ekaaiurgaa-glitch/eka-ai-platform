import React from 'react';

const teamMembers = [
  {
    name: 'John Doe',
    title: 'CEO & Founder',
    avatar: 'https://via.placeholder.com/150',
    bio: 'John has over 20 years of experience in the industry and is passionate about creating innovative solutions.',
  },
  {
    name: 'Jane Smith',
    title: 'CTO',
    avatar: 'https://via.placeholder.com/150',
    bio: 'Jane is a technology enthusiast with a knack for building scalable and robust systems.',
  },
  {
    name: 'Sam Wilson',
    title: 'Lead Designer',
    avatar: 'https://via.placeholder.com/150',
    bio: 'Sam has a keen eye for design and is responsible for the look and feel of our products.',
  },
    {
    name: 'Alice Johnson',
    title: 'Marketing Manager',
    avatar: 'https://via.placeholder.com/150',
    bio: 'Alice is a marketing guru who loves to tell stories and connect with customers.',
  },
];

const AboutPage: React.FC = () => {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold font-heading leading-tight">
            Our Mission
          </h1>
          <p className="mt-4 text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
            To empower businesses with the tools they need to succeed in the digital age. We believe in creating intuitive, powerful, and affordable solutions that help businesses of all sizes grow and thrive.
          </p>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold font-heading text-center mb-12">
            Our Story
          </h2>
          <div className="max-w-4xl mx-auto text-text-secondary text-lg space-y-6">
            <p>
              Founded in 2024, our company was born out of a desire to simplify the complexities of running a business. We saw a gap in the market for a platform that was both powerful and easy to use, and we set out to create it.
            </p>
            <p>
              Our journey started with a small team of passionate individuals, and has since grown into a thriving company with a dedicated team of experts. We are proud of what we have achieved and are excited for what the future holds.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold font-heading text-center mb-12">
            Meet the Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-background-alt p-8 rounded-lg shadow-md text-center">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4"
                />
                <h3 className="text-xl font-bold font-heading mb-1">{member.name}</h3>
                <p className="text-text-secondary mb-4">{member.title}</p>
                <p className="text-text-secondary">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

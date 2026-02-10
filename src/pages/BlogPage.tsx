import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

const mockPosts = [
  {
    title: 'The Future of AI in the Automobile Industry',
    excerpt: 'Explore how artificial intelligence is revolutionizing the way we diagnose and repair vehicles.',
    imageUrl: 'https://via.placeholder.com/400x250',
    category: 'Technology',
    author: 'John Doe',
    date: 'Feb 10, 2026',
  },
  {
    title: '5 Tips for a More Efficient Workshop',
    excerpt: 'Discover practical tips to streamline your workshop operations and increase productivity.',
    imageUrl: 'https://via.placeholder.com/400x250',
    category: 'Productivity',
    author: 'Jane Smith',
    date: 'Feb 5, 2026',
  },
    {
    title: 'Understanding the New DPDP Act',
    excerpt: 'A deep dive into the new data privacy regulations and what they mean for your business.',
    imageUrl: 'https://via.placeholder.com/400x250',
    category: 'Compliance',
    author: 'Sam Wilson',
    date: 'Jan 28, 2026',
  },
  {
    title: 'The Rise of Electric Vehicles',
    excerpt: 'How the growing popularity of EVs is changing the landscape of the automobile industry.',
    imageUrl: 'https://via.placeholder.com/400x250',
    category: 'Technology',
    author: 'Alice Johnson',
    date: 'Jan 22, 2026',
  },
];

const categories = ['All', 'Technology', 'Productivity', 'Compliance'];

const BlogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPosts = useMemo(() => {
    return mockPosts.filter(post => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="bg-background">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold font-heading leading-tight">
            Our Blog
          </h1>
          <p className="mt-4 text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
            Stay up to date with the latest news and insights from our team.
          </p>
        </div>

        <div className="mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-full bg-background-alt"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-background-alt text-text-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post, index) => (
            <div key={index} className="bg-background-alt rounded-lg shadow-md overflow-hidden">
              <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <p className="text-sm text-primary mb-2">{post.category}</p>
                <h2 className="text-xl font-bold font-heading mb-2">{post.title}</h2>
                <p className="text-text-secondary mb-4">{post.excerpt}</p>
                <div className="flex items-center text-sm text-text-secondary">
                  <span>{post.author}</span>
                  <span className="mx-2">&bull;</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
            <div className="text-center py-16">
                <p className="text-xl text-text-secondary">No posts found.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;

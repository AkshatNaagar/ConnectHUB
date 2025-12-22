/**
 * Create more sample users for suggestions and chat
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createMoreUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const defaultPassword = await bcrypt.hash('Password123!', 12);

    const newUsers = [
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        password: defaultPassword,
        role: 'user',
        headline: 'Product Manager | Agile Expert',
        bio: 'Experienced product manager with a passion for building user-centric products. 5+ years in tech industry.',
        location: 'Mumbai, India',
        skills: ['Product Management', 'Agile', 'Scrum', 'User Research', 'Roadmapping', 'Jira'],
        experience: [{
          title: 'Senior Product Manager',
          company: 'Tech Innovators',
          location: 'Mumbai',
          startDate: new Date('2021-03-01'),
          current: true,
          description: 'Leading product development for mobile applications'
        }],
        education: [{
          school: 'Indian Institute of Management',
          degree: 'MBA',
          field: 'Product Management',
          startDate: new Date('2017-07-01'),
          endDate: new Date('2019-06-01')
        }]
      },
      {
        name: 'Rahul Verma',
        email: 'rahul.verma@example.com',
        password: defaultPassword,
        role: 'user',
        headline: 'Full Stack Developer | MERN Stack',
        bio: 'Passionate developer specializing in MERN stack. Love building scalable web applications.',
        location: 'Pune, India',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express', 'TypeScript', 'Redux'],
        experience: [{
          title: 'Full Stack Developer',
          company: 'StartUp Labs',
          location: 'Pune',
          startDate: new Date('2020-06-01'),
          current: true,
          description: 'Building full-stack applications using MERN stack'
        }],
        education: [{
          school: 'Pune University',
          degree: 'B.Tech',
          field: 'Computer Engineering',
          startDate: new Date('2016-08-01'),
          endDate: new Date('2020-05-01')
        }]
      },
      {
        name: 'Neha Gupta',
        email: 'neha.gupta@example.com',
        password: defaultPassword,
        role: 'user',
        headline: 'UI/UX Designer | Design Thinking',
        bio: 'Creative designer with an eye for detail. Specializing in user experience and interface design.',
        location: 'Bangalore, India',
        skills: ['UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research'],
        experience: [{
          title: 'Senior UI/UX Designer',
          company: 'Design Studio',
          location: 'Bangalore',
          startDate: new Date('2019-08-01'),
          current: true,
          description: 'Creating beautiful and functional user interfaces'
        }],
        education: [{
          school: 'National Institute of Design',
          degree: 'B.Des',
          field: 'Interaction Design',
          startDate: new Date('2015-07-01'),
          endDate: new Date('2019-06-01')
        }]
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.singh@example.com',
        password: defaultPassword,
        role: 'user',
        headline: 'DevOps Engineer | Cloud Architecture',
        bio: 'DevOps enthusiast with expertise in AWS, Docker, and Kubernetes. Automation is my passion!',
        location: 'Hyderabad, India',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Linux', 'CI/CD'],
        experience: [{
          title: 'DevOps Engineer',
          company: 'Cloud Solutions Inc',
          location: 'Hyderabad',
          startDate: new Date('2020-01-01'),
          current: true,
          description: 'Managing cloud infrastructure and automating deployments'
        }],
        education: [{
          school: 'BITS Pilani',
          degree: 'B.Tech',
          field: 'Computer Science',
          startDate: new Date('2016-08-01'),
          endDate: new Date('2020-05-01')
        }]
      },
      {
        name: 'Anjali Desai',
        email: 'anjali.desai@example.com',
        password: defaultPassword,
        role: 'user',
        headline: 'Business Analyst | Data-Driven Insights',
        bio: 'Analytical thinker helping businesses make data-driven decisions. Expert in market research.',
        location: 'Ahmedabad, India',
        skills: ['Business Analysis', 'SQL', 'Excel', 'Power BI', 'Market Research', 'Data Visualization'],
        experience: [{
          title: 'Business Analyst',
          company: 'Consulting Firm',
          location: 'Ahmedabad',
          startDate: new Date('2019-07-01'),
          current: true,
          description: 'Analyzing business requirements and providing insights'
        }],
        education: [{
          school: 'Gujarat University',
          degree: 'MBA',
          field: 'Business Analytics',
          startDate: new Date('2017-07-01'),
          endDate: new Date('2019-06-01')
        }]
      },
      {
        name: 'Karan Mehta',
        email: 'karan.mehta@example.com',
        password: defaultPassword,
        role: 'user',
        headline: 'Cybersecurity Specialist | Ethical Hacker',
        bio: 'Protecting digital assets and ensuring cybersecurity. CEH certified with 4+ years experience.',
        location: 'Chennai, India',
        skills: ['Cybersecurity', 'Ethical Hacking', 'Penetration Testing', 'Network Security', 'Python'],
        experience: [{
          title: 'Security Analyst',
          company: 'SecureNet',
          location: 'Chennai',
          startDate: new Date('2020-09-01'),
          current: true,
          description: 'Conducting security audits and vulnerability assessments'
        }],
        education: [{
          school: 'Anna University',
          degree: 'B.Tech',
          field: 'Information Technology',
          startDate: new Date('2016-08-01'),
          endDate: new Date('2020-05-01')
        }]
      },
      {
        name: 'Sneha Reddy',
        email: 'sneha.reddy@example.com',
        password: defaultPassword,
        role: 'user',
        headline: 'Digital Marketing Manager | SEO Expert',
        bio: 'Digital marketing professional with expertise in SEO, SEM, and social media marketing.',
        location: 'Bangalore, India',
        skills: ['Digital Marketing', 'SEO', 'Google Analytics', 'Social Media', 'Content Marketing'],
        experience: [{
          title: 'Digital Marketing Manager',
          company: 'Marketing Agency',
          location: 'Bangalore',
          startDate: new Date('2019-04-01'),
          current: true,
          description: 'Managing digital marketing campaigns for clients'
        }],
        education: [{
          school: 'Osmania University',
          degree: 'MBA',
          field: 'Marketing',
          startDate: new Date('2017-07-01'),
          endDate: new Date('2019-06-01')
        }]
      },
      {
        name: 'Aditya Kumar',
        email: 'aditya.kumar@example.com',
        password: defaultPassword,
        role: 'user',
        headline: 'Mobile App Developer | Flutter & React Native',
        bio: 'Creating beautiful mobile experiences. Specialized in cross-platform development.',
        location: 'Noida, India',
        skills: ['Flutter', 'React Native', 'Dart', 'Mobile Development', 'Firebase', 'REST APIs'],
        experience: [{
          title: 'Mobile Developer',
          company: 'App Creators',
          location: 'Noida',
          startDate: new Date('2020-02-01'),
          current: true,
          description: 'Building cross-platform mobile applications'
        }],
        education: [{
          school: 'Delhi Technological University',
          degree: 'B.Tech',
          field: 'Software Engineering',
          startDate: new Date('2016-08-01'),
          endDate: new Date('2020-05-01')
        }]
      },
      {
        name: 'Pooja Iyer',
        email: 'pooja.iyer@example.com',
        password: defaultPassword,
        role: 'user',
        headline: 'HR Manager | Talent Acquisition',
        bio: 'Human Resources professional passionate about finding the right talent and building great teams.',
        location: 'Mumbai, India',
        skills: ['HR Management', 'Recruitment', 'Employee Relations', 'Training', 'Performance Management'],
        experience: [{
          title: 'HR Manager',
          company: 'People First',
          location: 'Mumbai',
          startDate: new Date('2018-06-01'),
          current: true,
          description: 'Managing recruitment and employee engagement'
        }],
        education: [{
          school: 'Tata Institute of Social Sciences',
          degree: 'Masters',
          field: 'Human Resource Management',
          startDate: new Date('2016-07-01'),
          endDate: new Date('2018-05-01')
        }]
      },
      {
        name: 'Sanjay Patel',
        email: 'sanjay.patel@example.com',
        password: defaultPassword,
        role: 'user',
        headline: 'Blockchain Developer | Web3 Enthusiast',
        bio: 'Exploring the decentralized future. Building smart contracts and DApps.',
        location: 'Bangalore, India',
        skills: ['Blockchain', 'Solidity', 'Ethereum', 'Smart Contracts', 'Web3', 'DeFi'],
        experience: [{
          title: 'Blockchain Developer',
          company: 'Crypto Innovations',
          location: 'Bangalore',
          startDate: new Date('2021-01-01'),
          current: true,
          description: 'Developing decentralized applications and smart contracts'
        }],
        education: [{
          school: 'IIT Bombay',
          degree: 'B.Tech',
          field: 'Computer Science',
          startDate: new Date('2017-08-01'),
          endDate: new Date('2021-05-01')
        }]
      }
    ];

    console.log('📝 Creating new users...\n');
    
    for (const userData of newUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const newUser = await User.create(userData);
        console.log(`✅ Created: ${newUser.name}`);
      } else {
        console.log(`⏭️  Already exists: ${userData.name}`);
      }
    }

    console.log('\n✅ All users created successfully!');
    console.log('\n🎉 Refresh your browser to see new suggestions!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

createMoreUsers();

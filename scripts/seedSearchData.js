/**
 * =====================================================
 * SEED SEARCH DATA - People, Jobs & Companies
 * =====================================================
 * This script creates specific searchable data:
 * - People: Arpit Madaan, Archit Grover
 * - Jobs: Data Analyst, Cloud Computing
 * - Companies: Infosys, HCL Technologies, Wipro, Tech Mahindra
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const bcrypt = require('bcryptjs');

const seedSearchData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Hash a default password for all users
    const defaultPassword = await bcrypt.hash('Password123!', 12);

    // ==================== PEOPLE ====================
    console.log('\n📝 Creating People...');
    
    const peopleData = [
      {
        name: 'Arpit Madaan',
        email: 'arpit.madaan@example.com',
        password: defaultPassword,
        role: 'user',
        headline: 'Senior Software Engineer | Full Stack Developer',
        bio: 'Passionate software engineer with 5+ years of experience in building scalable web applications. Expert in React, Node.js, and cloud technologies.',
        location: 'Bangalore, India',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'Docker', 'Kubernetes'],
        experience: [{
          title: 'Senior Software Engineer',
          company: 'Tech Solutions Inc',
          location: 'Bangalore',
          startDate: new Date('2020-01-01'),
          current: true,
          description: 'Leading a team of 5 developers in building enterprise applications'
        }],
        education: [{
          school: 'Indian Institute of Technology Delhi',
          degree: 'B.Tech',
          field: 'Computer Science',
          startDate: new Date('2015-08-01'),
          endDate: new Date('2019-06-01')
        }]
      },
      {
        name: 'Archit Grover',
        email: 'archit.grover@example.com',
        password: defaultPassword,
        role: 'user',
        headline: 'Data Scientist | Machine Learning Engineer',
        bio: 'Data scientist specializing in machine learning and AI. Experienced in building predictive models and data pipelines for large-scale applications.',
        location: 'Delhi, India',
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Data Analysis', 'SQL', 'AWS'],
        experience: [{
          title: 'Data Scientist',
          company: 'Analytics Corp',
          location: 'Delhi',
          startDate: new Date('2019-06-01'),
          current: true,
          description: 'Building ML models for customer behavior prediction'
        }],
        education: [{
          school: 'Indian Institute of Technology Bombay',
          degree: 'M.Tech',
          field: 'Data Science',
          startDate: new Date('2017-08-01'),
          endDate: new Date('2019-05-01')
        }]
      }
    ];

    // Check if people already exist
    for (const person of peopleData) {
      const existing = await User.findOne({ email: person.email });
      if (!existing) {
        const newUser = await User.create(person);
        console.log(`✅ Created user: ${newUser.name}`);
      } else {
        console.log(`⏭️  User already exists: ${person.name}`);
      }
    }

    // ==================== COMPANIES ====================
    console.log('\n🏢 Creating Companies...');
    
    const companiesData = [
      {
        name: 'Infosys Recruitment Team',
        email: 'careers@infosys.com',
        password: defaultPassword,
        role: 'company',
        location: 'Bangalore, India',
        headline: 'Global Leader in Technology Services & Consulting',
        bio: 'Infosys is a global leader in next-generation digital services and consulting, enabling clients to navigate their digital transformation.',
        companyInfo: {
          companyName: 'Infosys',
          industry: 'Information Technology',
          companySize: '200,000+ employees',
          website: 'https://www.infosys.com',
          description: 'Infosys is a global leader in next-generation digital services and consulting. We enable clients in more than 50 countries to navigate their digital transformation. With over four decades of experience in managing the systems and workings of global enterprises, we expertly steer our clients through their digital journey.',
          foundedYear: '1981'
        }
      },
      {
        name: 'HCL Technologies HR',
        email: 'careers@hcltech.com',
        password: defaultPassword,
        role: 'company',
        location: 'Noida, India',
        headline: 'Engineering & R&D Services | IT & Digital Services',
        bio: 'HCL Technologies is a leading global technology company that helps enterprises reimagine their businesses for the digital age.',
        companyInfo: {
          companyName: 'HCL Technologies',
          industry: 'Information Technology',
          companySize: '150,000+ employees',
          website: 'https://www.hcltech.com',
          description: 'HCL Technologies is a next-generation global technology company that helps enterprises reimagine their businesses for the digital age. Our technology products, services, and engineering are built on four decades of innovation, with a world-renowned management philosophy, a strong culture of invention and risk-taking, and a relentless focus on customer relationships.',
          foundedYear: '1976'
        }
      },
      {
        name: 'Wipro Talent Acquisition',
        email: 'careers@wipro.com',
        password: defaultPassword,
        role: 'company',
        location: 'Bangalore, India',
        headline: 'Global Technology Services & Consulting Company',
        bio: 'Wipro Limited is a leading global information technology, consulting and business process services company.',
        companyInfo: {
          companyName: 'Wipro',
          industry: 'Information Technology',
          companySize: '200,000+ employees',
          website: 'https://www.wipro.com',
          description: 'Wipro Limited is a leading global information technology, consulting and business process services company. We harness the power of cognitive computing, hyper-automation, robotics, cloud, analytics and emerging technologies to help our clients adapt to the digital world and make them successful.',
          foundedYear: '1945'
        }
      },
      {
        name: 'Tech Mahindra Careers',
        email: 'careers@techmahindra.com',
        password: defaultPassword,
        role: 'company',
        location: 'Pune, India',
        headline: 'Digital Transformation, Consulting & Business Re-engineering',
        bio: 'Tech Mahindra represents the connected world, offering innovative and customer-centric information technology experiences.',
        companyInfo: {
          companyName: 'Tech Mahindra',
          industry: 'Information Technology',
          companySize: '125,000+ employees',
          website: 'https://www.techmahindra.com',
          description: 'Tech Mahindra represents the connected world, offering innovative and customer-centric information technology experiences, enabling Enterprises, Associates and the Society to Rise. We are a USD 5.2 billion company with 125,000+ professionals across 90 countries, helping 1000+ global customers including Fortune 500 companies.',
          foundedYear: '1986'
        }
      }
    ];

    const createdCompanies = [];
    for (const company of companiesData) {
      const existing = await User.findOne({ email: company.email });
      if (!existing) {
        const newCompany = await User.create(company);
        createdCompanies.push(newCompany);
        console.log(`✅ Created company: ${newCompany.companyInfo.companyName}`);
      } else {
        createdCompanies.push(existing);
        console.log(`⏭️  Company already exists: ${company.companyInfo.companyName}`);
      }
    }

    // ==================== JOBS ====================
    console.log('\n💼 Creating Jobs...');
    
    if (createdCompanies.length > 0) {
      const jobsData = [
        {
          title: 'Data Analyst',
          description: 'We are looking for a Data Analyst to join our growing team. You will be responsible for collecting, processing, and performing statistical analyses of data. The ideal candidate will turn data into information, information into insight and insight into business decisions.\n\nKey Responsibilities:\n- Interpret data, analyze results using statistical techniques\n- Develop and implement databases, data collection systems, data analytics and other strategies\n- Acquire data from primary or secondary data sources and maintain databases\n- Identify, analyze, and interpret trends or patterns in complex data sets\n- Filter and clean data by reviewing computer reports, printouts, and performance indicators\n- Work with management to prioritize business and information needs\n- Locate and define new process improvement opportunities',
          company: 'Infosys',
          location: 'Bangalore, India',
          type: 'full-time',
          experienceLevel: 'mid',
          salary: {
            min: 600000,
            max: 1200000,
            currency: 'INR',
            period: 'yearly'
          },
          requirements: [
            'Bachelor\'s degree in Mathematics, Economics, Computer Science, Information Management or Statistics',
            '3-5 years of experience as a data analyst or in a related field',
            'Strong knowledge of and experience with reporting packages (Business Objects etc), databases (SQL etc)',
            'Knowledge of statistics and experience using statistical packages for analyzing datasets',
            'Strong analytical skills with the ability to collect, organize, analyze data',
            'Technical expertise regarding data models, database design development, data mining',
            'Adept at queries, report writing and presenting findings'
          ],
          responsibilities: [
            'Analyze large datasets to identify trends and patterns',
            'Create reports and dashboards for stakeholders',
            'Collaborate with teams to understand business requirements',
            'Develop and maintain data pipelines',
            'Present findings to management and recommend actions'
          ],
          skills: ['SQL', 'Python', 'Excel', 'Tableau', 'Statistics', 'Data Visualization', 'Power BI'],
          postedBy: createdCompanies[0]._id,
          status: 'active',
          isRemote: false,
          industry: 'Information Technology',
          tags: ['data', 'analytics', 'sql', 'python', 'tableau']
        },
        {
          title: 'Senior Data Analyst',
          description: 'Join HCL Technologies as a Senior Data Analyst and work on cutting-edge analytics projects for our global clients. You will lead data analysis initiatives and mentor junior analysts.\n\nResponsibilities:\n- Lead complex data analysis projects\n- Design and implement analytical frameworks\n- Mentor junior team members\n- Present insights to C-level executives\n- Collaborate with data science teams\n- Drive data-driven decision making across organization',
          company: 'HCL Technologies',
          location: 'Noida, India',
          type: 'full-time',
          experienceLevel: 'senior',
          salary: {
            min: 1200000,
            max: 1800000,
            currency: 'INR',
            period: 'yearly'
          },
          requirements: [
            '5+ years of experience in data analysis',
            'Advanced SQL and Python skills',
            'Experience with big data technologies',
            'Strong communication and presentation skills',
            'Leadership experience'
          ],
          responsibilities: [
            'Lead data analysis projects',
            'Mentor junior analysts',
            'Present to stakeholders',
            'Design analytical frameworks'
          ],
          skills: ['SQL', 'Python', 'R', 'Tableau', 'Power BI', 'Big Data', 'Machine Learning'],
          postedBy: createdCompanies[1]._id,
          status: 'active',
          isRemote: false,
          industry: 'Information Technology',
          tags: ['senior', 'data', 'analytics', 'leadership']
        },
        {
          title: 'Cloud Computing Engineer',
          description: 'Wipro is seeking a Cloud Computing Engineer to design, implement, and manage cloud infrastructure solutions. You will work with cutting-edge cloud technologies and help our clients migrate to the cloud.\n\nKey Responsibilities:\n- Design and deploy scalable, highly available, and fault-tolerant cloud systems\n- Implement and control the flow of data to and from AWS/Azure/GCP\n- Select appropriate cloud services to design and deploy applications\n- Estimate AWS/Azure/GCP usage costs and identify cost control mechanisms\n- Migrate complex, multi-tier applications on cloud platforms\n- Implement security best practices and compliance requirements\n- Automate cloud operations using Infrastructure as Code (IaC)\n- Monitor and optimize cloud resource utilization',
          company: 'Wipro',
          location: 'Bangalore, India',
          type: 'full-time',
          experienceLevel: 'mid',
          salary: {
            min: 800000,
            max: 1500000,
            currency: 'INR',
            period: 'yearly'
          },
          requirements: [
            'Bachelor\'s degree in Computer Science or related field',
            '3-5 years of experience with cloud platforms (AWS/Azure/GCP)',
            'Strong understanding of cloud architecture and services',
            'Experience with containerization (Docker, Kubernetes)',
            'Proficiency in at least one programming language (Python, Java, Go)',
            'Knowledge of CI/CD pipelines and DevOps practices',
            'AWS/Azure/GCP certification preferred',
            'Experience with Infrastructure as Code (Terraform, CloudFormation)'
          ],
          responsibilities: [
            'Design and implement cloud infrastructure solutions',
            'Migrate on-premise applications to cloud',
            'Optimize cloud costs and performance',
            'Implement security and compliance measures',
            'Automate deployment and operations',
            'Troubleshoot and resolve cloud infrastructure issues'
          ],
          skills: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Python', 'DevOps', 'CI/CD'],
          postedBy: createdCompanies[2]._id,
          status: 'active',
          isRemote: false,
          industry: 'Information Technology',
          tags: ['cloud', 'aws', 'azure', 'devops', 'kubernetes']
        },
        {
          title: 'Cloud Solutions Architect',
          description: 'Tech Mahindra is looking for a Cloud Solutions Architect to lead cloud transformation initiatives. You will design enterprise-scale cloud solutions and guide our clients through their digital transformation journey.\n\nResponsibilities:\n- Architect end-to-end cloud solutions\n- Lead cloud migration projects\n- Provide technical leadership to development teams\n- Conduct cloud readiness assessments\n- Design hybrid and multi-cloud architectures\n- Establish cloud governance and best practices',
          company: 'Tech Mahindra',
          location: 'Pune, India',
          type: 'full-time',
          experienceLevel: 'senior',
          salary: {
            min: 1500000,
            max: 2500000,
            currency: 'INR',
            period: 'yearly'
          },
          requirements: [
            '7+ years of experience in cloud computing',
            'Multiple cloud certifications (AWS/Azure/GCP)',
            'Strong architectural and design skills',
            'Experience with enterprise-scale cloud deployments',
            'Excellent communication and client-facing skills'
          ],
          responsibilities: [
            'Design cloud architectures',
            'Lead migration projects',
            'Mentor development teams',
            'Present to C-level executives'
          ],
          skills: ['AWS', 'Azure', 'GCP', 'Cloud Architecture', 'Kubernetes', 'Microservices', 'DevOps'],
          postedBy: createdCompanies[3]._id,
          status: 'active',
          isRemote: false,
          industry: 'Information Technology',
          tags: ['cloud', 'architect', 'senior', 'leadership']
        },
        // Additional jobs from various companies
        {
          title: 'Junior Data Analyst',
          description: 'Entry-level position for fresh graduates looking to start their career in data analytics. You will work with senior analysts and learn industry best practices.',
          company: 'Tech Mahindra',
          location: 'Hyderabad, India',
          type: 'full-time',
          experienceLevel: 'entry',
          salary: {
            min: 400000,
            max: 600000,
            currency: 'INR',
            period: 'yearly'
          },
          requirements: [
            'Bachelor\'s degree in relevant field',
            'Basic knowledge of SQL and Excel',
            'Strong analytical thinking',
            'Good communication skills'
          ],
          responsibilities: [
            'Assist in data collection and analysis',
            'Create basic reports',
            'Learn data visualization tools',
            'Support senior analysts'
          ],
          skills: ['SQL', 'Excel', 'Python', 'Statistics'],
          postedBy: createdCompanies[3]._id,
          status: 'active',
          isRemote: false,
          industry: 'Information Technology',
          tags: ['entry-level', 'data', 'analyst', 'fresher']
        },
        {
          title: 'Cloud DevOps Engineer',
          description: 'Looking for a DevOps engineer with cloud expertise to automate and streamline our operations and processes.',
          company: 'Infosys',
          location: 'Chennai, India',
          type: 'full-time',
          experienceLevel: 'mid',
          salary: {
            min: 900000,
            max: 1400000,
            currency: 'INR',
            period: 'yearly'
          },
          requirements: [
            '3-4 years of DevOps experience',
            'Strong scripting skills',
            'Experience with CI/CD tools',
            'Cloud platform knowledge'
          ],
          responsibilities: [
            'Build and maintain CI/CD pipelines',
            'Automate infrastructure provisioning',
            'Monitor system performance',
            'Implement security practices'
          ],
          skills: ['Jenkins', 'Docker', 'Kubernetes', 'AWS', 'Terraform', 'Python', 'Bash'],
          postedBy: createdCompanies[0]._id,
          status: 'active',
          isRemote: true,
          industry: 'Information Technology',
          tags: ['devops', 'cloud', 'automation', 'remote']
        }
      ];

      for (const job of jobsData) {
        const existing = await Job.findOne({ title: job.title, company: job.company });
        if (!existing) {
          const newJob = await Job.create(job);
          console.log(`✅ Created job: ${newJob.title} at ${newJob.company}`);
        } else {
          console.log(`⏭️  Job already exists: ${job.title} at ${job.company}`);
        }
      }
    }

    console.log('\n✅ Seed data creation completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- People: Arpit Madaan, Archit Grover');
    console.log('- Companies: Infosys, HCL Technologies, Wipro, Tech Mahindra');
    console.log('- Jobs: Data Analyst, Cloud Computing Engineer, and related positions');
    console.log('\n🔍 You can now search for these names in the search page!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the seed function
seedSearchData();

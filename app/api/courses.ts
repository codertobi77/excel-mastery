import { NextApiRequest, NextApiResponse } from 'next';

const courses = [
  { id: 1, title: 'Introduction to Programming', description: 'Learn the basics of programming.' },
  { id: 2, title: 'Advanced JavaScript', description: 'Deep dive into JavaScript.' },
  { id: 3, title: 'React for Beginners', description: 'Get started with React.' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(courses);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

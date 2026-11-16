/*
  Team roster for /about#instructors.

  To swap the roster: drop new headshots in public/, import them below, and
  replace the entries in `team`. Order here is display order. Set
  `hidden: true` to keep someone in the file without showing them.
  `courses` must use names from `courseColor` (add a new course there first).
*/
import type { StaticImageData } from 'next/image'
import type { BlockColor } from '../components/Block'
import johnnyWang from 'public/johnny_wang.jpg'
import kartikBalu from 'public/kartik_balu.jpg'
import victorJiang from 'public/victor_jiang.jpg'
import chrisWang from 'public/chris_wang.jpg'
import ericLan from 'public/eric_lan.jpg'
import michaelLan from 'public/michael_lan.jpg'
import eganWang from 'public/egan_wang.jpg'
import benjaminMan from 'public/benjamin_man.jpg'
import rohanGulati from 'public/rohan_gulati.jpg'
import srinidhiRaghavendran from 'public/srinidhi_raghavendran.jpg'
import ojusGarg from 'public/ojus_garg.jpg'

// Course -> block category color (text color follows the AA rule in globals.css).
export const courseColor = {
  Python: 'yellow',
  'Game Development': 'purple',
  Robotics: 'orange',
  'Git + GitHub': 'teal',
  'AP CSA': 'pink',
  'Intro to Algebra': 'green',
  'AMC 8': 'green',
  'AMC 10': 'green',
  'Intro to Physics': 'blue',
  'AP Physics 1': 'blue',
} satisfies Record<string, BlockColor>

export type Course = keyof typeof courseColor

export type Person = {
  name: string
  role: string
  photo: StaticImageData
  bio: string
  current: boolean // current team vs. former/retired
  tags: Course[]
  hidden?: boolean
}

export const team: Person[] = [
  {
    name: 'Johnny',
    role: 'Co-President, Instructor',
    photo: johnnyWang,
    current: true,
    tags: ['Robotics'],
    bio: 'Johnny is a Senior at Valley Christian High School that likes programming, robotics, and football. He has 2 years of programming experience and 3 years of robotics experience. Johnny is currently the programming mentor for 2 middle school robotics teams and seeks to pass on his programming knowledge.',
  },
  {
    name: 'Kartik',
    role: 'Co-President, Instructor',
    photo: kartikBalu,
    current: true,
    tags: ['AP CSA'],
    bio: 'Kartik is a Senior at Cupertino High School. He is interested in Coding, Math and Soccer. In his free time, he enjoys hiking and spending time with his family. He also enjoys playing soccer with his friends. Being with friends is something he always prefers which helps balance his high school academic life.',
  },
  {
    name: 'Victor',
    role: 'Vice President, Instructor',
    photo: victorJiang,
    current: true,
    tags: ['Intro to Algebra'],
    bio: 'Victor is a junior at Stratford Preparatory Blackford. He enjoys taekwondo and robotics, and has been coding since 6th grade. He has worked with Java, JavaScript, Python and C++.',
  },
  {
    name: 'Chris',
    role: 'Former Leadership',
    photo: chrisWang,
    current: false,
    tags: ['AMC 10', 'AP Physics 1'],
    bio: 'Chris is a graduate from Mission San Jose High School. He is interested in a variety of STEM related topics such as mathematics, reading, science, and especially astronomy. He enjoys witnessing the wonders of the natural world and outer space. Chris is also one who is always willing to help out others or the community. During his free time, he likes to hang out with his friends or exercise.',
  },
  {
    name: 'Eric',
    role: 'Former Leadership',
    photo: ericLan,
    current: false,
    tags: ['AP CSA'],
    bio: "Eric is a graduate from Irvington High School. He is interested in scripting, modeling, and graphic design. In his free time, Eric enjoys hiking, gaming, photography, and pondering life's big questions. Eric finds solace and inspiration in the great outdoors. Hiking through nature's scenic trails allows him to escape the hustle and bustle of everyday life, connecting him with the serenity and beauty of the natural world.",
  },
  {
    name: 'Michael',
    role: 'Advisor',
    photo: michaelLan,
    current: true,
    tags: ['Git + GitHub', 'AP CSA'],
    bio: 'Michael is a second-year at UCLA majoring in computer science and minoring in philosophy. His research interests include functional programming, programming language design, and compilers. He also love software engineering and has 2+ years of experience in full-stack software development and DevOps.',
  },
  {
    name: 'Egan',
    role: 'Advisor',
    photo: eganWang,
    current: false,
    tags: ['AMC 8'],
    bio: "Egan is a first-year in UT Austin's honors engineering program. He enjoys writing in his spare time, but also takes pleasure in debate. Egan teaches AMC math but has extensive background in other subjects as well such as Java and science.",
    hidden: true,
  },
  {
    name: 'Ben',
    role: 'Former Leadership',
    photo: benjaminMan,
    current: false,
    tags: ['Game Development'],
    bio: "Ben is a first-year at UCLA studying computer science and linguistics. He enjoys developing web apps and games, and has been learning programming for 4+ years. He's experienced in Javascript, Python, C#, and Java. In his free time he like playing badminton and experimenting with things on his computer like digital art, music production, photo manipulation, Android development, along with many other things.",
  },
  {
    name: 'Rohan',
    role: 'Advisor',
    photo: rohanGulati,
    current: false,
    tags: ['AP CSA'],
    bio: 'Rohan is a second-year at UC Berkeley. His passions include computer science, physics, machine learning, and sustainability. He enjoys engaging in research and staying involved in his community either through service or education. He has taught a variety of topics from pure math to robot automation. As a teacher, his primary goal is to play a role in helping someone discover their own spark or passion.',
  },
  {
    name: 'Sri',
    role: 'Co-Founder',
    photo: srinidhiRaghavendran,
    current: false,
    tags: ['AP CSA', 'Python'],
    bio: 'Sri is a third-year at UC Berkeley studying computer science. He enjoys math, computer science, cricket and basketball. He has taken multiple computer science courses at local community colleges and is highly proficient in Java, HTML, CSS and Python. Sri takes pleasure in giving back to his community and his parent’s home country.',
  },
  {
    name: 'Ojus',
    role: 'Co-Founder',
    photo: ojusGarg,
    current: false,
    tags: ['AP CSA'],
    bio: 'Ojus is a third-year at UC Berkeley studying computer science. He is a STEM-oriented student who has passions in computer science, math, and finance. Ojus loves to give back to his community and help underprivileged kids around the world.',
  },
]

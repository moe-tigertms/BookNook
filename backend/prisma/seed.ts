/// <reference types="node" />
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.checkout.deleteMany();
  await prisma.book.deleteMany();

  const openLibraryCover = (isbn: string) =>
    `https://covers.openlibrary.org/b/isbn/${isbn.replace(/-/g, "")}-M.jpg`;

  await prisma.book.createMany({
    data: [
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        genre: "Fiction",
        year: 1925,
        isbn: "978-0-7432-7356-5",
        coverUrl: openLibraryCover("978-0-7432-7356-5"),
        description:
          "A story of decadence and the American Dream in the Jazz Age.",
      },
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        genre: "Fiction",
        year: 1960,
        isbn: "978-0-06-112008-4",
        coverUrl: openLibraryCover("978-0-06-112008-4"),
        description:
          "A young girl in the American South witnesses racial injustice.",
      },
      {
        title: "1984",
        author: "George Orwell",
        genre: "Dystopian",
        year: 1949,
        isbn: "978-0-452-28423-4",
        coverUrl: openLibraryCover("978-0-452-28423-4"),
        description: "Totalitarianism and surveillance in a future society.",
      },
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        genre: "Romance",
        year: 1813,
        coverUrl: "https://covers.openlibrary.org/b/olid/OL7353617M-M.jpg",
        description: "Elizabeth Bennet and Mr. Darcy in Regency England.",
      },
      {
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        genre: "Fiction",
        year: 1951,
        coverUrl: "https://covers.openlibrary.org/b/olid/OL7367934M-M.jpg",
        description: "Teenage alienation and identity in New York.",
      },
      {
        title: "Animal Farm",
        author: "George Orwell",
        genre: "Dystopian",
        year: 1945,
        coverUrl: openLibraryCover("978-0-452-28424-1"),
        description: "A satirical allegory of totalitarianism.",
      },
      {
        title: "Brave New World",
        author: "Aldous Huxley",
        genre: "Dystopian",
        year: 1932,
        isbn: "978-0-06-085052-4",
        coverUrl: "https://covers.openlibrary.org/b/id/8231823-M.jpg",
        description:
          "A futuristic society of genetic engineering and happiness.",
      },
      {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        genre: "Fantasy",
        year: 1937,
        isbn: "978-0-547-92822-7",
        coverUrl: openLibraryCover("978-0-547-92822-7"),
        description: "A reluctant hobbit embarks on an unexpected adventure.",
      },
      {
        title: "Lord of the Flies",
        author: "William Golding",
        genre: "Fiction",
        year: 1954,
        isbn: "978-0-14-028333-4",
        coverUrl: openLibraryCover("978-0-14-028333-4"),
        description: "Schoolboys stranded on an island descend into savagery.",
      },
      {
        title: "Fahrenheit 451",
        author: "Ray Bradbury",
        genre: "Dystopian",
        year: 1953,
        isbn: "978-0-7432-4722-1",
        coverUrl: openLibraryCover("978-0-7432-4722-1"),
        description: "A fireman who burns books questions his role in a censored society.",
      },
      {
        title: "The Lord of the Rings",
        author: "J.R.R. Tolkien",
        genre: "Fantasy",
        year: 1954,
        isbn: "978-0-544-04720-2",
        coverUrl: openLibraryCover("978-0-544-04720-2"),
        description: "An epic quest to destroy a powerful ring and save Middle-earth.",
      },
      {
        title: "One Hundred Years of Solitude",
        author: "Gabriel García Márquez",
        genre: "Fiction",
        year: 1967,
        isbn: "978-0-06-088328-7",
        coverUrl: openLibraryCover("978-0-06-088328-7"),
        description: "The rise and fall of the Buendía family in Macondo.",
      },
      {
        title: "The Chronicles of Narnia: The Lion, the Witch and the Wardrobe",
        author: "C.S. Lewis",
        genre: "Fantasy",
        year: 1950,
        isbn: "978-0-06-440942-1",
        coverUrl: openLibraryCover("978-0-06-440942-1"),
        description: "Children discover a magical wardrobe leading to the land of Narnia.",
      },
      {
        title: "Slaughterhouse-Five",
        author: "Kurt Vonnegut",
        genre: "Fiction",
        year: 1969,
        isbn: "978-0-385-33384-9",
        coverUrl: openLibraryCover("978-0-385-33384-9"),
        description: "A man unstuck in time experiences the bombing of Dresden.",
      },
      {
        title: "The Handmaid's Tale",
        author: "Margaret Atwood",
        genre: "Dystopian",
        year: 1985,
        isbn: "978-0-385-49087-9",
        coverUrl: openLibraryCover("978-0-385-49087-9"),
        description: "A woman navigates a theocratic regime where women are subjugated.",
      },
      {
        title: "Harry Potter and the Philosopher's Stone",
        author: "J.K. Rowling",
        genre: "Fantasy",
        year: 1997,
        isbn: "978-0-7475-3269-9",
        coverUrl: openLibraryCover("978-0-7475-3269-9"),
        description: "A young wizard discovers his destiny at Hogwarts School.",
      },
      {
        title: "The Kite Runner",
        author: "Khaled Hosseini",
        genre: "Fiction",
        year: 2003,
        isbn: "978-1-59448-000-3",
        coverUrl: openLibraryCover("978-1-59448-000-3"),
        description: "A story of friendship, betrayal, and redemption in Afghanistan.",
      },
      {
        title: "The Alchemist",
        author: "Paulo Coelho",
        genre: "Fiction",
        year: 1988,
        isbn: "978-0-06-231500-7",
        coverUrl: openLibraryCover("978-0-06-231500-7"),
        description: "A shepherd pursues his personal legend and discovers life's treasures.",
      },
      {
        title: "The Da Vinci Code",
        author: "Dan Brown",
        genre: "Thriller",
        year: 2003,
        isbn: "978-0-385-50420-5",
        coverUrl: openLibraryCover("978-0-385-50420-5"),
        description: "A symbologist uncovers a conspiracy hidden in art and religion.",
      },
      {
        title: "The Girl with the Dragon Tattoo",
        author: "Stieg Larsson",
        genre: "Thriller",
        year: 2005,
        isbn: "978-0-307-26975-1",
        coverUrl: openLibraryCover("978-0-307-26975-1"),
        description: "A journalist and a hacker investigate a decades-old disappearance.",
      },
      {
        title: "The Road",
        author: "Cormac McCarthy",
        genre: "Fiction",
        year: 2006,
        isbn: "978-0-307-26543-2",
        coverUrl: openLibraryCover("978-0-307-26543-2"),
        description: "A father and son journey through a post-apocalyptic America.",
      },
      {
        title: "The Book Thief",
        author: "Markus Zusak",
        genre: "Fiction",
        year: 2005,
        isbn: "978-0-375-83100-3",
        coverUrl: openLibraryCover("978-0-375-83100-3"),
        description: "A young girl finds solace in stealing books in Nazi Germany.",
      },
      {
        title: "The Fault in Our Stars",
        author: "John Green",
        genre: "Romance",
        year: 2012,
        isbn: "978-0-525-47881-2",
        coverUrl: openLibraryCover("978-0-525-47881-2"),
        description: "Two teenagers with cancer fall in love and seek meaning in life.",
      },
      {
        title: "Gone Girl",
        author: "Gillian Flynn",
        genre: "Thriller",
        year: 2012,
        isbn: "978-0-307-58836-4",
        coverUrl: openLibraryCover("978-0-307-58836-4"),
        description: "A man becomes the prime suspect when his wife goes missing.",
      },
      {
        title: "Educated",
        author: "Tara Westover",
        genre: "Memoir",
        year: 2018,
        isbn: "978-0-399-59050-9",
        coverUrl: openLibraryCover("978-0-399-59050-9"),
        description: "A woman leaves her survivalist family and pursues education.",
      },
      {
        title: "Where the Crawdads Sing",
        author: "Delia Owens",
        genre: "Fiction",
        year: 2018,
        isbn: "978-0-7352-1909-0",
        coverUrl: openLibraryCover("978-0-7352-1909-0"),
        description: "A mysterious woman in the North Carolina marshes is accused of murder.",
      },
      {
        title: "Project Hail Mary",
        author: "Andy Weir",
        genre: "Science Fiction",
        year: 2021,
        isbn: "978-0-593-35909-9",
        coverUrl: openLibraryCover("978-0-593-35909-9"),
        description: "A lone astronaut must save Earth from an extinction-level threat.",
      },
    ],
  });

  console.log("Seed completed.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

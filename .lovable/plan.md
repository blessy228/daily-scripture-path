
## Add Book Completion Counts to Testament Progress

### Overview
Add book-level completion tracking for each testament, displayed above the existing chapter progress bars.

### Changes to StatsDashboard.tsx

**1. Calculate book counts per testament**
In the `useMemo` stats calculation, add:
- `oldTestamentBooksTotal`: Count of Old Testament books (39)
- `newTestamentBooksTotal`: Count of New Testament books (27)
- `oldTestamentBooksCompleted`: Books with 100% chapters read in Old Testament
- `newTestamentBooksCompleted`: Books with 100% chapters read in New Testament

**2. Update the Testament Progress UI**
Modify the display to show two rows per testament:
- **Books row**: "X/39 books" with progress bar
- **Chapters row**: "X/929 chapters" with progress bar (existing)

### Updated Layout
```text
Testament Progress
------------------
Old Testament
  [=====-----] 2/39 books
  [==--------] 150/929 chapters

New Testament  
  [===-------] 3/27 books
  [====------] 89/260 chapters
```

### Technical Details

**Stats calculation additions (lines ~127-145):**
```typescript
// Calculate total books per testament
const oldTestamentBooksTotal = BIBLE_BOOKS.filter(b => b.testament === "old").length; // 39
const newTestamentBooksTotal = BIBLE_BOOKS.filter(b => b.testament === "new").length; // 27

// Calculate completed books per testament
let oldTestamentBooksCompleted = 0;
let newTestamentBooksCompleted = 0;

BIBLE_BOOKS.forEach((book) => {
  const readChapters = chaptersByBook.get(book.name)?.size || 0;
  if (readChapters === book.chapters) { // Book is 100% complete
    if (book.testament === "old") {
      oldTestamentBooksCompleted++;
    } else {
      newTestamentBooksCompleted++;
    }
  }
});
```

**Return object additions:**
```typescript
return {
  // ... existing properties
  oldTestamentBooksCompleted,
  oldTestamentBooksTotal,
  newTestamentBooksCompleted,
  newTestamentBooksTotal,
};
```

**UI update (Testament Progress section):**
Each testament will have two progress indicators stacked:
1. Books progress (new) - smaller/secondary styling
2. Chapters progress (existing)

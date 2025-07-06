import { Component, EventEmitter, input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search.component.html',
})
export class SearchComponent {
  placeHolder = input.required<string>()
  searchTerm: string = '';
  @Output() search = new EventEmitter<string>();

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(debounceTime(300)).subscribe((term) => {
      this.search.emit(term.trim().toLowerCase());
    });
  }

  onSearch() {
    console.log('Search term:', this.searchTerm);
    this.searchSubject.next(this.searchTerm);
  }
}

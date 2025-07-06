import { Component, computed, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagination',
  imports: [RouterLink],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {

  pages = input<number>(0);
  currentPage = input<number>(1);
  activePage = linkedSignal(this.currentPage)
  previousPage = computed(() => Math.max(1, this.activePage() - 1));
  nextPage = computed(() => Math.min(this.pages(), this.activePage() + 1));

  getPages = computed(() => {
    const total = this.pages();
    const current = this.activePage();

    const pages: number[] = [];

    if (total <= 1) return [1];

    pages.push(1); // Siempre primera

    for (let i = current - 1; i <= current + 1; i++) {
      if (i > 1 && i < total) {
        pages.push(i);
      }
    }

    if (!pages.includes(total)) {
      pages.push(total); // Siempre última
    }

    return [...new Set(pages)].sort((a, b) => a - b); // Quitar duplicados y ordenar
  });

  hasLeftDots = computed(() => this.getPages()[1] > 2);
  hasRightDots = computed(() => {
    const pages = this.getPages();
    return pages[pages.length - 2] < this.pages() - 1;
  });



}

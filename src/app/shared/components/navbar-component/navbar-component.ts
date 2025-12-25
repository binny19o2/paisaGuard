import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';
import { User } from '../../../core/models';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ClickOutsideDirective],
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.css'
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  isProfileDropdownOpen = false;
  isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  closeProfileDropdown() {
    this.isProfileDropdownOpen = false;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isProfileDropdownOpen = false;
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  onNavLinkClick() {
    this.closeMobileMenu();
    this.closeProfileDropdown();
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth']);
    this.closeProfileDropdown();
  }
}
# Product Overview

## Application Name

IDP IELTS Booking System

## Environment

| Field | Value |
|-------|-------|
| Environment | DEV |
| Base URL | `https://bxsearch.dev.ielts.com` |
| Application Type | Single Page Application (SPA) |
| Rendering | Client-side (JavaScript required) |

## Purpose

Online booking platform for IELTS (International English Language Testing System) tests operated by IDP. Allows candidates to search and book IELTS test sessions by selecting test type, format, location, and date.

## Core Modules

| Module | Entry Point | Status |
|--------|-------------|--------|
| Booking Wizard | `/wizard` | Discovered |

## Key Features (Observed)

1. Multi-step booking wizard (4 steps)
2. Multiple test types (Academic, General Training, UKVI)
3. Multi-language support (EN + others via dropdown)
4. User account system (user icon present)
5. Cookie consent management (OneTrust)
6. Legal compliance (T&C + Privacy Policy agreement before booking)
7. LambdaTest integration for remote browser testing (infrastructure)

## Third-Party Integrations (Observed)

| Integration | Purpose | Evidence |
|-------------|---------|----------|
| OneTrust | Cookie consent management | Cookie banner with OneTrust DOM IDs |
| Analytics (s2s) | Tracking | URL params: s2s_fbp, s2s_ga, s2s_gac, s2s_ttp |
| IDP IELTS Main Site | Parent platform | Links to ielts.idp.com |

## Target Users

- IELTS test candidates seeking to book Academic, General Training, or UKVI tests

## Confidence

| Section | Level |
|---------|-------|
| Application identity | High |
| Core modules | Medium (only Wizard discovered) |
| Integrations | Medium (inferred from DOM/URLs) |

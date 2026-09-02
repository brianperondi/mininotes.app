Version 0.0.3


Refactor Feature: Limit default starter collection to Ideas for new users

Updated default app initialization logic in `src/index.html` to only create the "Ideas" collection for first-time users, removing the automatic creation of the "Research" and "Meetings" example collections. Existing local storage state for returning users remains unaffected.


Version 0.0.2

Bug Fix

Fixed edit structure — Getting an error when I try to add or remove a field

Newly added structure fields now omit their temporary UI ID during saving, while existing field IDs remain preserved. This prevents the “does not belong to collection” error.


Version: 0.0.1

1st Commit 

Created a flexible notes system that allows users to build different types of notes using a shared set of standard note fields and organize those notes into collections.

Every note should have a Title.
The title appears at the top of the note and is used to identify the note within its collection.


Created a shared library of standard fields that can be added to notes.

* Short Text — Single-line text
* Long Text — Multi-line text
* Checklist — List of items that can be checked or unchecked
* Date — Date field
* Number — Numeric value
* Tags — One or more tags
* Links — One or more URLs
* Attachments — Files or other attachments
* Wikipedia Search field


Custom Notes

Users can create a new custom note and decide which of the standard note fields should be included.
When creating the note, the user should be able to:

	1	Enter a title.
	2	Select the standard fields they want to include.
	3	Arrange the selected fields in the desired order.
	4	Add content to those fields.
	5	Save the note.


A note does not need to contain every available field.


Note Collections

Users can create collections for organizing their notes.

Each collection should appear in the left sidebar so users can quickly navigate between different groups of notes.

Example:

Notes

	•	Meetings
	•	Ideas
	•	Research
	•	Customers


Opening a collection displays the notes saved within that collection.


Reusable Note Structure

A collection can optionally have a standard note structure.

For example, a Meeting Notes collection could use:

	•	Title
	•	Date
	•	Attendees
	•	Notes
	•	Checklist


When a user creates a new note in that collection, those fields are automatically available.

This allows the same notes system to support many use cases without requiring a separate feature for each type of note.

User Flow

Create Collection → Choose Fields → Create Note → Fill Out Note → Save to Collection

The key concept is:

Fields are reusable building blocks. Collections define how those building blocks are used, and notes contain the actual content.

This keeps V1 focused while leaving a clean path to add dropdowns, custom field types, templates, and more advanced collection behavior later.



* Added the visible WebMCP status indicator with registering, ready, unavailable, and failure states.

Verified in the browser:

	•	All five tools registered and were discoverable.
	•	Collection creation, note creation, note updates, and readback succeeded.
	•	Unknown properties were rejected with useful errors.
	•	WebMCP actions updated the visible interface.
	•	The normal note editor still saves correctly.
	•	No console errors or deprecated navigator.modelContext usage.





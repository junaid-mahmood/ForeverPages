document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const editModal = document.getElementById('edit-modal');
    const searchInput = document.getElementById('box-search');
    const searchButton = document.getElementById('search-button');
    const MAX_CHAR_LIMIT = 100;

    // Generate 25,000 boxes (50x500 grid)
    for (let i = 0; i < 25000; i++) {
        const box = document.createElement('div');
        box.classList.add('grid-box');
        box.dataset.id = i;
        box.addEventListener('click', () => openEditModal(i));
        gridContainer.appendChild(box);
    }

    // Search functionality
    searchButton.addEventListener('click', searchBox);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBox();
        }
    });

    function searchBox() {
        const boxNumber = parseInt(searchInput.value);
        if (boxNumber >= 0 && boxNumber < 25000) {
            const targetBox = document.querySelector(`.grid-box[data-id="${boxNumber}"]`);
            if (targetBox) {
                targetBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetBox.style.border = '2px solid red';
                setTimeout(() => {
                    targetBox.style.border = 'none';
                }, 3000);
            }
        } else {
            alert('Please enter a valid box number between 0 and 24999');
        }
    }

    function openEditModal(boxId) {
        const box = document.querySelector(`.grid-box[data-id="${boxId}"]`);
        const content = box.querySelector('.grid-box-content')?.textContent || '';
        const imageUrl = box.querySelector('img')?.src || '';

        editModal.innerHTML = `
            <div class="modal-content">
                <h2>Edit Box ${boxId}</h2>
                <textarea id="box-content" maxlength="${MAX_CHAR_LIMIT}">${content}</textarea>
                <div id="char-count">0 / ${MAX_CHAR_LIMIT}</div>
                <input type="file" id="image-upload" accept="image/*">
                <button onclick="saveEdit(${boxId})">Save</button>
                <button onclick="closeModal()">Cancel</button>
            </div>
        `;
        editModal.style.display = 'block';

        const textarea = document.getElementById('box-content');
        const charCount = document.getElementById('char-count');
        textarea.addEventListener('input', () => {
            charCount.textContent = `${textarea.value.length} / ${MAX_CHAR_LIMIT}`;
        });
        charCount.textContent = `${content.length} / ${MAX_CHAR_LIMIT}`;

        if (imageUrl) {
            const imagePreview = document.createElement('img');
            imagePreview.src = imageUrl;
            imagePreview.style.maxWidth = '100%';
            imagePreview.style.marginBottom = '10px';
            editModal.querySelector('.modal-content').insertBefore(imagePreview, editModal.querySelector('#image-upload'));
        }
    }

    window.saveEdit = async (boxId) => {
        const content = document.getElementById('box-content').value;
        const imageFile = document.getElementById('image-upload').files[0];

        const formData = new FormData();
        formData.append('content', content);
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const response = await fetch(`/api/boxes/${boxId}`, {
                method: 'POST',
                body: formData,
            });
            if (response.ok) {
                const result = await response.json();
                updateBox(boxId, content, result.imageUrl);
                closeModal();
            } else {
                console.error('Failed to save edit');
            }
        } catch (error) {
            console.error('Error saving edit:', error);
        }
    };

    function updateBox(boxId, content, imageUrl) {
        const box = document.querySelector(`.grid-box[data-id="${boxId}"]`);
        box.innerHTML = '';
        if (imageUrl) {
            const img = new Image();
            img.onload = () => {
                box.appendChild(img);
                addContentToBox(box, content);
            };
            img.onerror = () => {
                addContentToBox(box, content);
            };
            img.src = imageUrl;
        } else {
            addContentToBox(box, content);
        }
    }

    function addContentToBox(box, content) {
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('grid-box-content');
        contentDiv.textContent = content;
        box.appendChild(contentDiv);
    }

    window.closeModal = () => {
        editModal.style.display = 'none';
    };

    // Load existing box contents
    async function loadBoxContents() {
        try {
            const response = await fetch('/api/boxes');
            const boxes = await response.json();
            Object.entries(boxes).forEach(([id, data]) => {
                updateBox(id, data.content, data.imageUrl);
            });
        } catch (error) {
            console.error('Error loading box contents:', error);
        }
    }

    loadBoxContents();
});
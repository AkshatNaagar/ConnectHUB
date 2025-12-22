let currentPage = 1;
const userId = document.querySelector('input[name="userId"]') ? document.querySelector('input[name="userId"]').value : null;

document.addEventListener('DOMContentLoaded', () => {
    loadFeedPosts();
    loadSuggestedConnections();
    loadPendingRequests();
    loadUserPostCount();
    setupEventListeners();
    
    // Event delegation for dynamically created buttons
    document.addEventListener('click', function(e) {
        // Delete post button
        if (e.target.closest('.delete-post-btn')) {
            e.preventDefault();
            const postId = e.target.closest('.delete-post-btn').dataset.postId;
            if (postId) {
                deletePost(postId);
            }
        }
        
        // Like button
        if (e.target.closest('.like-button')) {
            e.preventDefault();
            const button = e.target.closest('.like-button');
            const postId = button.dataset.postId;
            if (postId) {
                toggleLike(postId, button);
            }
        }
        
        // Toggle comments button
        if (e.target.closest('.toggle-comments-btn')) {
            e.preventDefault();
            const postId = e.target.closest('.toggle-comments-btn').dataset.postId;
            if (postId) {
                toggleComments(postId);
            }
        }
        
        // Add comment button
        if (e.target.closest('.add-comment-btn')) {
            e.preventDefault();
            const postId = e.target.closest('.add-comment-btn').dataset.postId;
            if (postId) {
                addComment(postId);
            }
        }
        
        // Delete comment button
        if (e.target.closest('.delete-comment-btn')) {
            e.preventDefault();
            const button = e.target.closest('.delete-comment-btn');
            const postId = button.dataset.postId;
            const commentId = button.dataset.commentId;
            if (postId && commentId) {
                deleteComment(postId, commentId);
            }
        }
        
        // Send connection request button
        if (e.target.closest('.send-connection-btn')) {
            e.preventDefault();
            const button = e.target.closest('.send-connection-btn');
            const userId = button.dataset.userId;
            if (userId) {
                sendConnectionRequest(userId, button);
            }
        }
        
        // Accept connection request button
        if (e.target.closest('.accept-connection-btn')) {
            e.preventDefault();
            const button = e.target.closest('.accept-connection-btn');
            const userId = button.dataset.userId;
            if (userId) {
                acceptConnectionRequest(userId);
            }
        }
        
        // Reject connection request button
        if (e.target.closest('.reject-connection-btn')) {
            e.preventDefault();
            const button = e.target.closest('.reject-connection-btn');
            const userId = button.dataset.userId;
            if (userId) {
                rejectConnectionRequest(userId);
            }
        }
    });
});

function setupEventListeners() {
    // Camera button in modal to trigger file input
    const modalCameraBtn = document.getElementById('modalCameraBtn');
    if (modalCameraBtn) {
        modalCameraBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Modal camera button clicked');
            document.getElementById('modalProfilePictureInput').click();
        });
    }
    
    // Profile picture upload in modal
    const modalProfilePictureInput = document.getElementById('modalProfilePictureInput');
    if (modalProfilePictureInput) {
        modalProfilePictureInput.addEventListener('change', function() {
            console.log('File selected in modal:', this.files);
            if (this.files && this.files[0]) {
                previewProfilePicture(this);
            }
        });
    }
    
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }
    
    const createPostBtn = document.getElementById('createPostBtn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', createPost);
    }
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMorePosts);
    }
    
    const postType = document.getElementById('postType');
    if (postType) {
        postType.addEventListener('change', function() {
            const achievementFields = document.getElementById('achievementFields');
            if (achievementFields) {
                achievementFields.style.display = this.value === 'achievement' ? 'block' : 'none';
            }
        });
    }
    
    const postImages = document.getElementById('postImages');
    if (postImages) {
        postImages.addEventListener('change', function() {
            previewImages(this);
        });
    }
}

async function loadFeedPosts(page = 1) {
    try {
        const response = await fetch(`/api/posts/feed?page=${page}&limit=10`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (page === 1) {
            document.getElementById('postsContainer').innerHTML = '';
        }
        
        if (data.data.posts.length === 0 && page === 1) {
            document.getElementById('postsContainer').innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <p>No posts yet. Start by creating your first post!</p>
                </div>
            `;
            return;
        }
        
        data.data.posts.forEach(post => appendPost(post));
    } catch (error) {
        console.error('Error loading posts:', error);
        showError('Failed to load posts');
    }
}

function appendPost(post) {
    const container = document.getElementById('postsContainer');
    const postCard = document.createElement('div');
    postCard.className = 'card post-card';
    postCard.dataset.postId = post._id;
    
    const isLiked = post.likes.some(like => like._id === userId);
    const postDate = new Date(post.createdAt).toLocaleDateString();
    
    let achievementBadge = '';
    if (post.postType === 'achievement' && post.achievement) {
        achievementBadge = `
            <div class="achievement-badge p-3 rounded mb-3">
                <div class="d-flex align-items-center">
                    <i class="bi bi-trophy-fill achievement-icon me-3"></i>
                    <div>
                        <h6 class="mb-1">${escapeHtml(post.achievement.title)}</h6>
                        <small>${escapeHtml(post.achievement.organization)} • ${new Date(post.achievement.date).toLocaleDateString()}</small>
                    </div>
                </div>
            </div>
        `;
    }
    
    let imagesHtml = '';
    if (post.images && post.images.length > 0) {
        imagesHtml = post.images.map(img => 
            `<img src="${img}" class="post-image mb-2" alt="Post image">`
        ).join('');
    }
    
    const isOwnPost = post.author._id === userId;
    
    postCard.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex">
                    <img src="${post.author.profilePicture}" class="user-avatar me-2">
                    <div>
                        <h6 class="mb-0">${escapeHtml(post.author.name)}</h6>
                        <small class="text-muted">${escapeHtml(post.author.headline || 'Professional')} • ${postDate}</small>
                    </div>
                </div>
                ${isOwnPost ? `
                    <button class="btn btn-sm btn-link text-danger delete-post-btn" data-post-id="${post._id}">
                        <i class="bi bi-trash"></i>
                    </button>
                ` : ''}
            </div>
            
            ${achievementBadge}
            <p class="mb-3">${escapeHtml(post.content)}</p>
            ${imagesHtml}
            
            <div class="post-actions">
                <div class="d-flex justify-content-around mb-2">
                    <button class="btn btn-sm ${isLiked ? 'btn-primary' : 'btn-light'} flex-fill me-1 like-button" data-post-id="${post._id}" data-liked="${isLiked}">
                        <i class="bi bi-hand-thumbs-up${isLiked ? '-fill' : ''}"></i> 
                        <span class="like-count">${post.likes.length}</span>
                    </button>
                    <button class="btn btn-sm btn-light flex-fill ms-1 toggle-comments-btn" data-post-id="${post._id}">
                        <i class="bi bi-chat"></i> ${post.comments.length}
                    </button>
                </div>
                
                <div class="comments-section" id="comments-${post._id}" style="display: none;">
                    <div class="comment-list" id="comment-list-${post._id}">
                        ${post.comments.map(comment => {
                            const isOwnComment = comment.user._id === userId;
                            const isPostAuthor = post.author._id === userId;
                            return `
                            <div class="comment-box mb-2" data-comment-id="${comment._id}">
                                <div class="d-flex">
                                    <img src="${comment.user.profilePicture}" class="user-avatar-small me-2">
                                    <div class="flex-grow-1">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div class="flex-grow-1">
                                                <strong>${escapeHtml(comment.user.name)}</strong>
                                                <p class="mb-0 small">${escapeHtml(comment.content)}</p>
                                                <small class="text-muted">${new Date(comment.createdAt).toLocaleDateString()}</small>
                                            </div>
                                            ${(isOwnComment || isPostAuthor) ? `
                                                <button class="btn btn-sm btn-link text-danger p-0 delete-comment-btn" data-post-id="${post._id}" data-comment-id="${comment._id}">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        }).join('')}
                    </div>
                    <div class="d-flex mt-2">
                        <input type="text" class="form-control form-control-sm me-2 comment-input" placeholder="Write a comment..." id="comment-input-${post._id}">
                        <button class="btn btn-sm btn-primary add-comment-btn" data-post-id="${post._id}">Post</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(postCard);
}

async function loadSuggestedConnections() {
    try {
        // Fetch suggestions and sent requests in parallel
        const [suggestionsRes, sentRequestsRes] = await Promise.all([
            fetch('/api/posts/suggestions/connections?limit=5', { credentials: 'include' }),
            fetch('/api/users/connections/sent', { credentials: 'include' })
        ]);
        
        const suggestionsData = await suggestionsRes.json();
        const sentRequestsData = await sentRequestsRes.json();
        
        const sentRequestIds = sentRequestsData.data.requests.map(req => req.to._id);
        
        const container = document.getElementById('suggestionsContainer');
        container.innerHTML = '';
        
        if (suggestionsData.data.suggestions.length === 0) {
            container.innerHTML = '<p class="text-muted small text-center">No suggestions available</p>';
            return;
        }
        
        suggestionsData.data.suggestions.forEach(user => {
            const isPending = sentRequestIds.includes(user._id);
            const userCard = document.createElement('div');
            userCard.className = 'connection-card border-bottom py-2';
            userCard.innerHTML = `
                <div class="d-flex align-items-center">
                    <a href="/profile/${user._id}" class="text-decoration-none">
                        <img src="${user.profilePicture}" class="user-avatar me-2" style="cursor: pointer;">
                    </a>
                    <div class="flex-grow-1">
                        <a href="/profile/${user._id}" class="text-decoration-none text-dark">
                            <h6 class="mb-0 small">${escapeHtml(user.name)}</h6>
                        </a>
                        <p class="mb-0 text-muted" style="font-size: 0.75rem;">${escapeHtml(user.headline || 'Professional')}</p>
                    </div>
                </div>
                ${isPending ? 
                    '<button class="btn btn-sm btn-success w-100 mt-2" disabled><i class="bi bi-check"></i> Request Sent</button>' :
                    '<button class="btn btn-sm btn-outline-primary w-100 mt-2 send-connection-btn" data-user-id="' + user._id + '"><i class="bi bi-person-plus"></i> Connect</button>'
                }
            `;
            container.appendChild(userCard);
        });
    } catch (error) {
        console.error('Error loading suggestions:', error);
    }
}

function previewProfilePicture(input) {
    if (!input.files || !input.files[0]) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('modalProfileImage').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
}

async function saveProfile() {
    const skills = document.getElementById('editSkills').value
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
    
    const formData = new FormData();
    formData.append('name', document.getElementById('editName').value);
    formData.append('headline', document.getElementById('editHeadline').value);
    formData.append('bio', document.getElementById('editBio').value);
    formData.append('location', document.getElementById('editLocation').value);
    formData.append('skills', JSON.stringify(skills));
    
    // Add profile picture if selected
    const profilePictureInput = document.getElementById('modalProfilePictureInput');
    if (profilePictureInput.files && profilePictureInput.files[0]) {
        formData.append('profilePicture', profilePictureInput.files[0]);
    }
    
    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            credentials: 'include',
            body: formData
        });
        
        const data = await response.json();
        if (response.ok) {
            showSuccess('Profile updated successfully!');
            setTimeout(() => location.reload(), 1000);
        } else {
            console.error('Profile update error:', data);
            showError(data.message || 'Error updating profile');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error updating profile: ' + error.message);
    }
}

function previewImages(input) {
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';
    
    if (input.files) {
        Array.from(input.files).slice(0, 5).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'image-preview';
                container.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
}

async function createPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content) {
        showError('Please enter post content');
        return;
    }
    
    const formData = new FormData();
    formData.append('content', content);
    formData.append('postType', document.getElementById('postType').value);
    formData.append('visibility', document.getElementById('postVisibility').value);
    
    if (document.getElementById('postType').value === 'achievement') {
        const achievement = {
            title: document.getElementById('achievementTitle').value,
            organization: document.getElementById('achievementOrg').value,
            date: document.getElementById('achievementDate').value
        };
        formData.append('achievement', JSON.stringify(achievement));
    }
    
    const images = document.getElementById('postImages').files;
    for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
    }
    
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const data = await response.json();
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('createPostModal')).hide();
            document.getElementById('createPostForm').reset();
            document.getElementById('imagePreviewContainer').innerHTML = '';
            document.getElementById('achievementFields').style.display = 'none';
            currentPage = 1;
            loadFeedPosts(1);
            loadUserPostCount();
            showSuccess('Post created successfully!');
        } else {
            showError(data.message || 'Error creating post');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error creating post');
    }
}

async function toggleLike(postId, button) {
    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        if (response.ok) {
            const likeCount = button.querySelector('.like-count');
            likeCount.textContent = data.data.likeCount;
            
            const icon = button.querySelector('i');
            if (data.data.liked) {
                button.classList.remove('btn-light');
                button.classList.add('btn-primary');
                icon.classList.add('bi-hand-thumbs-up-fill');
                icon.classList.remove('bi-hand-thumbs-up');
            } else {
                button.classList.remove('btn-primary');
                button.classList.add('btn-light');
                icon.classList.remove('bi-hand-thumbs-up-fill');
                icon.classList.add('bi-hand-thumbs-up');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) return;
    
    try {
        const response = await fetch(`/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content })
        });
        
        const data = await response.json();
        if (response.ok) {
            input.value = '';
            currentPage = 1;
            loadFeedPosts(1);
            showSuccess('Comment added!');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
        console.log('Deleting post:', postId);
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        console.log('Delete response status:', response.status);
        const data = await response.json();
        console.log('Delete response data:', data);
        
        if (response.ok) {
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                postElement.remove();
                loadUserPostCount();
                showSuccess('Post deleted successfully!');
            }
        } else {
            showError(data.message || 'Failed to delete post');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showError('Error deleting post: ' + error.message);
    }
}

async function deleteComment(postId, commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
        console.log('Deleting comment:', commentId, 'from post:', postId);
        const response = await fetch(`/api/posts/${postId}/comment/${commentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        console.log('Delete comment response:', data);
        
        if (response.ok) {
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentElement) {
                commentElement.remove();
                showSuccess('Comment deleted successfully!');
            }
        } else {
            showError(data.message || 'Failed to delete comment');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        showError('Error deleting comment: ' + error.message);
    }
}

async function sendConnectionRequest(userId, button) {
    try {
        const response = await fetch('/api/users/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId })
        });
        
        const data = await response.json();
        if (response.ok) {
            showSuccess('Connection request sent!');
            // Immediately reload suggestions to show updated status
            loadSuggestedConnections();
        } else {
            showError(data.message || 'Error sending request');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error sending connection request');
    }
}

async function loadPendingRequests() {
    try {
        const response = await fetch('/api/users/connections/pending', {
            credentials: 'include'
        });
        const data = await response.json();
        
        const card = document.getElementById('pendingRequestsCard');
        const container = document.getElementById('pendingRequestsContainer');
        
        if (data.data.requests.length === 0) {
            card.style.display = 'none';
            return;
        }
        
        card.style.display = 'block';
        container.innerHTML = '';
        
        data.data.requests.forEach(request => {
            const reqDiv = document.createElement('div');
            reqDiv.className = 'connection-card border-bottom py-2';
            reqDiv.innerHTML = `
                <div class="d-flex align-items-center mb-2">
                    <img src="${request.from.profilePicture}" class="user-avatar me-2">
                    <div class="flex-grow-1">
                        <h6 class="mb-0 small">${escapeHtml(request.from.name)}</h6>
                        <p class="mb-0 text-muted" style="font-size: 0.75rem;">${escapeHtml(request.from.headline || 'Professional')}</p>
                    </div>
                </div>
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-primary flex-fill accept-connection-btn" data-user-id="${request.from._id}">
                        <i class="bi bi-check"></i> Accept
                    </button>
                    <button class="btn btn-sm btn-outline-secondary flex-fill reject-connection-btn" data-user-id="${request.from._id}">
                        <i class="bi bi-x"></i> Reject
                    </button>
                </div>
            `;
            container.appendChild(reqDiv);
        });
    } catch (error) {
        console.error('Error loading pending requests:', error);
    }
}

async function acceptConnectionRequest(userId) {
    try {
        const response = await fetch('/api/users/connect/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId })
        });
        
        const data = await response.json();
        if (response.ok) {
            showSuccess('Connection accepted!');
            // Reload everything
            loadPendingRequests();
            loadSuggestedConnections();
            updateConnectionCount();
        } else {
            showError(data.message || 'Error accepting request');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error accepting connection request');
    }
}

async function rejectConnectionRequest(userId) {
    try {
        const response = await fetch('/api/users/connect/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId })
        });
        
        const data = await response.json();
        if (response.ok) {
            showSuccess('Connection request rejected');
            loadPendingRequests();
        } else {
            showError(data.message || 'Error rejecting request');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error rejecting connection request');
    }
}

async function updateConnectionCount() {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            document.getElementById('connectionCount').textContent = data.data.user.connections.length;
        }
    } catch (error) {
        console.error('Error updating connection count:', error);
    }
}

function loadMorePosts() {
    currentPage++;
    loadFeedPosts(currentPage);
}

async function loadUserPostCount() {
    try {
        const response = await fetch(`/api/posts/user/${userId}?limit=1000`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            document.getElementById('postCount').textContent = data.data.posts.length;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function setPostType(type) {
    setTimeout(() => {
        document.getElementById('postType').value = type;
        document.getElementById('achievementFields').style.display = type === 'achievement' ? 'block' : 'none';
    }, 100);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccess(message) {
    alert(message);
}

function showError(message) {
    alert(message);
}

import api from "./api";

// Represents a category returned by the Django API.
export interface Category {
  id: number;
  name: string;
  created_at: string;
}

// Data required to create or update a category.
export interface CategoryInput {
  name: string;
}

// Retrieves all categories belonging to the authenticated user.
export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get<Category[]>("categories/");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw error;
  }
};

// Creates a new category.
export const createCategory = async (
  category: CategoryInput
): Promise<Category> => {
  try {
    const response = await api.post<Category>("categories/", category);
    return response.data;
  } catch (error) {
    console.error("Failed to create category:", error);
    throw error;
  }
};

// Updates an existing category.
export const updateCategory = async (
  id: number,
  category: Partial<CategoryInput>
): Promise<Category> => {
  try {
    const response = await api.patch<Category>(
      `categories/${id}/`,
      category
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to update category ${id}:`, error);
    throw error;
  }
};

// Deletes a category.
export const deleteCategory = async (id: number): Promise<void> => {
  try {
    await api.delete(`categories/${id}/`);
  } catch (error) {
    console.error(`Failed to delete category ${id}:`, error);
    throw error;
  }
};
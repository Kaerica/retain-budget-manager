from rest_framework.pagination import PageNumberPagination


class ExpensePagination(PageNumberPagination):
    """
    Pagination for expense lists. It is only applied when the request
    includes a `page` query parameter (e.g. /api/expenses/?page=2), so
    existing clients that expect a plain list keep working.
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

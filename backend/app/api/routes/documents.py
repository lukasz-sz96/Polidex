from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_documents():
    return {"documents": []}


@router.delete("/{document_id}")
async def delete_document(document_id: int):
    return {"message": "Document deleted"}

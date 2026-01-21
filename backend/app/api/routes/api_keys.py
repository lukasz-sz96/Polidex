from fastapi import APIRouter

router = APIRouter()


@router.post("")
async def create_api_key():
    return {"key": ""}


@router.get("")
async def list_api_keys():
    return {"api_keys": []}


@router.delete("/{key_id}")
async def delete_api_key(key_id: int):
    return {"message": "API key deleted"}
